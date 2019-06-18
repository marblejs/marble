/* eslint-disable @typescript-eslint/no-use-before-define */
import * as t from 'io-ts';
import { JSONSchema7 } from 'json-schema';

enum IoTag {
  BOOLEAN = 'BooleanType',
  NUMBER = 'NumberType',
  STRING = 'StringType',
  UNDEFINED = 'UndefinedType',
  NULL = 'NullType',
  LITERAL = 'LiteralType',
  UNION = 'UnionType',
  KEYOF = 'KeyofType',
  INTERSECTION = 'IntersectionType',
  ARRAY = 'ArrayType',
  TUPLE = 'TupleType',
  INTERFACE = 'InterfaceType',
  PARTIAL = 'PartialType',
  EXACT = 'ExactType',
  DICTIONARY = 'DictionaryType',
  REFINEMENT = 'RefinementType',
  CUSTOM_JSON_SCHEMA = 'CustomJsonSchemaType',
}

type IoConverter = (type: any, supertypes: any[]) => any;

interface CustomJsonSchemaType<A, O = A, I = unknown> extends t.Type<A, O, I> {
  _tag: IoTag.CUSTOM_JSON_SCHEMA;
  jsonSchema: JSONSchema7;
}

const undefinedJsonType = Object.freeze({ type: 'undefined' });

/**
 * Returns true if element is union which had undefined elements
 */
const removeUndefinedValuesFromUnion = (jsonSchema: any) => {
  if (jsonSchema.anyOf) {
    const elements: any[] = jsonSchema.anyOf;
    jsonSchema.anyOf = elements.filter(e => e !== undefinedJsonType);
    return elements.length != jsonSchema.anyOf.length;
  }
  return false;
};

const IoTypes: Record<IoTag, IoConverter> = {
  [IoTag.BOOLEAN]: () => ({ type: 'boolean' }),

  [IoTag.NUMBER]: (_, supertypes) => supertypes.some(type => type.name === 'Int')
    ? { type: 'integer' }
    : { type: 'number' },

  [IoTag.STRING]: () => ({ type: 'string' }),

  [IoTag.UNDEFINED]: () => undefinedJsonType,

  [IoTag.NULL]: () => ({ type: 'null' }),

  [IoTag.LITERAL]: (type: t.LiteralType<any>) => ({ const: type.value }),

  [IoTag.UNION]: (type: t.UnionType<t.Any[]>) =>
    type.types.every(element => getTag(element) === IoTag.LITERAL)
      ? { enum: type.types.map((element: any) => element.value) }
      : { anyOf: type.types.map(type => convert(type)) },

  [IoTag.KEYOF]: (type: t.KeyofType<Record<string, unknown>>) => ({
    enum: Object.keys(type.keys),
  }),

  [IoTag.INTERSECTION]: (type: t.IntersectionType<t.Any[]>) => ({
    allOf: type.types.map(type => convert(type)),
  }),

  [IoTag.ARRAY]: (type: t.ArrayType<t.Any>) => ({
    type: 'array',
    items: convert(type.type),
  }),

  [IoTag.TUPLE]: (type: t.TupleType<t.Any[]>) => {
    const length = type.types.length;
    return {
      type: 'array',
      items: type.types.map(type => convert(type)),
      minItems: length,
      maxItems: length,
    };
  },

  [IoTag.INTERFACE]: (type: t.InterfaceType<Record<string, t.Any>>, supertypes: any) => {
    let required = Object.keys(type.props);
    const properties = Object.entries(type.props)
      .reduce((result, [key, value]) => {
        // Convert children to JSON Schema
        const jsonSchemaValue: any = convert(value);

        // Un-require values that are unions with undefined
        if (removeUndefinedValuesFromUnion(jsonSchemaValue)) {
          required = required.filter(k => k !== key);
        }
        result[key] = jsonSchemaValue;
        return result;
      }, {});
    return {
      type: 'object',
      properties,
      required,
      additionalProperties: !supertypes.find(type => getTag(type) === IoTag.EXACT),
    };
  },

  [IoTag.PARTIAL]: (type: t.PartialType<Record<string, t.Any>>, supertypes: any) => ({
    type: 'object',
    properties: Object.entries(type.props)
      .reduce((result, [key, value]) => {
        result[key] = convert(value);
        return result;
      }, {}),
    additionalProperties: !supertypes.includes(type => getTag(type) === IoTag.EXACT),
  }),

  [IoTag.DICTIONARY]: (type: t.DictionaryType<t.Any, t.Any>) => ({
    type: 'object',
    additionalProperties: convert(type.codomain),
  }),

  [IoTag.EXACT]: (type: t.ExactType<any>, supertypes) =>
    convert(type.type, [...supertypes, type]),

  [IoTag.REFINEMENT]: (type: t.RefinementType<any>, supertypes) =>
    convert(type.type, [...supertypes, type]),

  [IoTag.CUSTOM_JSON_SCHEMA]: (type: CustomJsonSchemaType<any, any>) =>
    type.jsonSchema,
};

export const getTag = (ioType: t.Any): IoTag => {
  const tag = (ioType as any)._tag;
  if (!IoTypes[tag]) {
    throw new Error(`Unsupported type with tag: ${tag}\n${JSON.stringify(ioType, null, 2)}`);
  }
  return tag;
};

export const getIoConverter = (tag: IoTag) => IoTypes[tag];

const convert = <K extends IoTag>(ioType: t.Any, supertypes: any[] = []): JSONSchema7 =>
  getIoConverter(getTag(ioType))(ioType, supertypes);

const filterTree = <T>(element: T, matcher: (value: any) => boolean): T | undefined => {
  if (Array.isArray(element)) {
    return element.filter(e => filterTree(e, matcher)) as any;
  } else if (typeof element === 'object') {
    const result: any = {};
    for (const key in element) {
      if (element.hasOwnProperty(key) && matcher(element[key])) {
        result[key] = filterTree(element[key], matcher);
      }
    }
    return result;
  }
  return matcher(element) ? element : undefined;
};

export const mergeJsonObjects = (...schemas: (JSONSchema7 | undefined)[]): JSONSchema7 | undefined => {
  const filteredSchemas = schemas.filter(Boolean) as JSONSchema7[];
  const result: JSONSchema7 = filteredSchemas[0];
  for (const schema of filteredSchemas.slice(1)) {
    const { properties, required } = schema;
    result.properties = { ...result.properties, ...properties };
    result.required = [...(result.required || []), ...(required || [])];
  }
  return result;
};

export const ioTypeToJsonSchema = (ioType: t.Any | undefined): JSONSchema7 | undefined => {
  if (!ioType) {
    return undefined;
  }
  const jsonSchema = convert(ioType);
  // Remove undefined elements, as the can not be a part of JSON Schema
  return filterTree(jsonSchema, element => element !== undefinedJsonType);
};

export const withJsonSchema = <A, O = A, I = unknown>(ioType: t.Type<A, O, I>, jsonSchema: JSONSchema7) => {
  const type: CustomJsonSchemaType<A, O, I> = ioType as any;
  type._tag = IoTag.CUSTOM_JSON_SCHEMA;
  type.jsonSchema = jsonSchema;
  return type;
};
