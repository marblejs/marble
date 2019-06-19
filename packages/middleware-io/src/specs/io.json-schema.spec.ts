import * as t from 'io-ts';
import { ioTypeToJsonSchema, mergeJsonObjects, withJsonSchema } from '../io.json-schema';
import { JSONSchema7 } from 'json-schema';

const customIntegerStringType = () => new t.Type<number, string, unknown>(
  'IntegerString',
  t.number.is,
  (u, c) =>
    t.string.validate(u, c).chain(s => {
      const d = parseFloat(s);
      return isNaN(d) || d % 1 !== 0 ? t.failure(u, c) : t.success(d);
    }),
  String,
);
const customIntegerStringSchema: JSONSchema7 = {
  type: 'string',
  pattern: '^\\d+$',
};

describe('#ioTypeToJsonSchema', () => {
  test('supports t.string conversion', () => {
    expect(ioTypeToJsonSchema(t.string)).toEqual({ type: 'string' });
  });

  test('supports t.number conversion', () => {
    expect(ioTypeToJsonSchema(t.number)).toEqual({ type: 'number' });
  });

  test('supports t.int conversion', () => {
    expect(ioTypeToJsonSchema(t.Int)).toEqual({ type: 'integer' });
  });

  test('supports t.boolean conversion', () => {
    expect(ioTypeToJsonSchema(t.boolean)).toEqual({ type: 'boolean' });
  });

  test('supports t.array conversion', () => {
    expect(ioTypeToJsonSchema(t.array(t.string))).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  test('supports t.record conversion', () => {
    expect(ioTypeToJsonSchema(t.record(t.string, t.number))).toEqual({
      type: 'object',
      additionalProperties: { type: 'number' },
    });
  });

  test('supports t.keyof conversion', () => {
    expect(ioTypeToJsonSchema(t.keyof({
      a: null,
      b: null,
      c: null,
    }))).toEqual({
      enum: ['a', 'b', 'c']
    });
  });

  test('supports t.undefined conversion', () => {
    expect(ioTypeToJsonSchema(t.type({
      requiredProp: t.string,
      optionalProp: t.union([t.undefined, t.string]),
    }))).toEqual({
      type: 'object',
      properties: {
        requiredProp: { type: 'string' },
        optionalProp: { anyOf: [{ type: 'string' }] },
      },
      additionalProperties: true,
      required: ['requiredProp'],
    });
  });

  test('supports t.interface conversion', () => {
    expect(ioTypeToJsonSchema(t.interface({
      name: t.string,
      age: t.number,
    }))).toEqual({
      type: 'object',
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      additionalProperties: true,
    });
  });

  test('supports t.exact(t.interface) conversion', () => {
    expect(ioTypeToJsonSchema(t.exact(t.interface({
      name: t.string,
      age: t.number,
    })))).toEqual({
      type: 'object',
      required: ['name', 'age'],
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      additionalProperties: false,
    });
  });

  test('supports t.partial conversion', () => {
    expect(ioTypeToJsonSchema(t.partial({
      name: t.string,
      age: t.number,
    }))).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      additionalProperties: true,
    });
  });

  test('supports t.literal conversion', () => {
    expect(ioTypeToJsonSchema(t.literal(30))).toEqual({ enum: [30] });
    expect(ioTypeToJsonSchema(t.literal(true))).toEqual({ enum: [true] });
    expect(ioTypeToJsonSchema(t.literal('test'))).toEqual({ enum: ['test'] });
  });

  test('supports t.null conversion', () => {
    expect(ioTypeToJsonSchema(t.null)).toEqual({ type: 'null' });
  });

  test('supports t.tuple conversion', () => {
    expect(ioTypeToJsonSchema(t.tuple([
      t.string, t.number, t.boolean,
    ]))).toEqual({
      type: 'array',
      items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
      maxItems: 3,
      minItems: 3,
    });
  });

  test('supports t.union conversion', () => {
    expect(ioTypeToJsonSchema(t.union([
      t.string, t.number, t.boolean,
    ]))).toEqual({
      anyOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
      ],
    });
  });

  test('supports optimized t.union of t.literal conversion', () => {
    expect(ioTypeToJsonSchema(t.union([
      t.literal('abc'), t.literal('def'), t.literal('ghi'),
    ]))).toEqual({
      enum: ['abc', 'def', 'ghi'],
    });
  });

  test('supports t.intersection conversion', () => {
    expect(ioTypeToJsonSchema(t.intersection([
      t.interface({
        a: t.number,
      }),
      t.interface({
        b: t.string
      }),
    ]))).toEqual({
      allOf: [
        { type: 'object', properties: { a: { type: 'number' } }, required: ['a'], additionalProperties: true },
        { type: 'object', properties: { b: { type: 'string' } }, required: ['b'], additionalProperties: true },
      ],
    });
  });

  test('supports custom JsonSchema added to custom type', () => {
    const integerString = withJsonSchema(customIntegerStringType(), customIntegerStringSchema);
    expect(ioTypeToJsonSchema(integerString)).toEqual(customIntegerStringSchema);
  });

  test('returns undefined if passed type is undefined', () => {
    expect(ioTypeToJsonSchema(undefined)).toBe(undefined);
  });

  test('throws an error on unknown io-ts type', () => {
    expect(() => ioTypeToJsonSchema({
      _tag: 'this is not a valid type'
    } as any)).toThrow('Unsupported type');
  });
});

describe('#withJsonSchema', () => {
  test('adds custom metadata to io-ts type', () => {
    const integerString = customIntegerStringType();

    expect((integerString as any)._tag).toBeUndefined();
    expect(withJsonSchema(integerString, customIntegerStringSchema)).toBe(integerString);

    expect(integerString).toHaveProperty('_tag', 'CustomJsonSchemaType');
    expect(integerString).toHaveProperty('jsonSchema', customIntegerStringSchema);
  });
});

describe('#mergeJsonObjects', () => {
  const object1: JSONSchema7 = {
    type: 'object',
    properties: {
      test: { type: 'string' },
      test2: { type: 'number' },
    },
    required: ['test2'],
  };

  const object2: JSONSchema7 = {
    type: 'object',
    properties: {
      test3: { type: 'boolean' },
      test4: { type: 'boolean' },
    },
    required: ['test3'],
  };

  test('merges properties and requires of objects', () => {
    expect(mergeJsonObjects(
      object1,
      object2,
    )).toEqual({
      type: 'object',
      properties: {
        test: { type: 'string' },
        test2: { type: 'number' },
        test3: { type: 'boolean' },
        test4: { type: 'boolean' },
      },
      required: ['test2', 'test3'],
    });
  });
  test('handles undefined objects', () => {
    expect(mergeJsonObjects(undefined, undefined)).toBeUndefined();
  });
  test('handles mixed values', () => {
    expect(mergeJsonObjects(
      undefined,
      { type: 'object' },
      object1,
      { type: 'object' },
      undefined,
    )).toEqual(object1);
  });
});
