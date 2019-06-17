import * as t from 'io-ts';
import { ioTypeToJsonSchema, withJsonSchema } from '../io.json-schema';
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
  it('supports t.string conversion', () => {
    expect(ioTypeToJsonSchema(t.string)).toEqual({ type: 'string' });
  });

  it('supports t.number conversion', () => {
    expect(ioTypeToJsonSchema(t.number)).toEqual({ type: 'number' });
  });

  it('supports t.int conversion', () => {
    expect(ioTypeToJsonSchema(t.Int)).toEqual({ type: 'integer' });
  });

  it('supports t.boolean conversion', () => {
    expect(ioTypeToJsonSchema(t.boolean)).toEqual({ type: 'boolean' });
  });

  it('supports t.array conversion', () => {
    expect(ioTypeToJsonSchema(t.array(t.string))).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('supports t.record conversion', () => {
    expect(ioTypeToJsonSchema(t.record(t.string, t.number))).toEqual({
      type: 'object',
      additionalProperties: { type: 'number' },
    });
  });

  it('supports t.keyof conversion', () => {
    expect(ioTypeToJsonSchema(t.keyof({
      a: null,
      b: null,
      c: null,
    }))).toEqual({
      enum: ['a', 'b', 'c']
    });
  });

  it('supports t.undefined conversion', () => {
    expect(ioTypeToJsonSchema(t.type({
      requiredProp: t.string,
      optionalProp: t.union([t.undefined, t.string]),
    }))).toEqual({
      type: 'object',
      properties: {
        requiredProp: {type: 'string' },
        optionalProp: { anyOf: [{type: 'string'}]},
      },
      additionalProperties: true,
      required: ['requiredProp'],
    });
  });

  it('supports t.interface conversion', () => {
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

  it('supports t.exact(t.interface) conversion', () => {
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

  it('supports t.partial conversion', () => {
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

  it('supports t.literal conversion', () => {
    expect(ioTypeToJsonSchema(t.literal(30))).toEqual({ const: 30 });
    expect(ioTypeToJsonSchema(t.literal(true))).toEqual({ const: true });
    expect(ioTypeToJsonSchema(t.literal('test'))).toEqual({ const: 'test' });
  });

  it('supports t.null conversion', () => {
    expect(ioTypeToJsonSchema(t.null)).toEqual({ type: 'null' });
  });

  it('supports t.tuple conversion', () => {
    expect(ioTypeToJsonSchema(t.tuple([
      t.string, t.number, t.boolean,
    ]))).toEqual({
      type: 'array',
      items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
      maxItems: 3,
      minItems: 3,
    });
  });

  it('supports t.union conversion', () => {
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

  it('supports optimized t.union of t.literal conversion', () => {
    expect(ioTypeToJsonSchema(t.union([
      t.literal('abc'), t.literal('def'), t.literal('ghi'),
    ]))).toEqual({
      enum: ['abc', 'def', 'ghi'],
    });
  });

  it('supports t.intersection conversion', () => {
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

  it('supports custom JsonSchema added to custom type', () => {
    const integerString = withJsonSchema(customIntegerStringType(), customIntegerStringSchema);
    expect(ioTypeToJsonSchema(integerString)).toEqual(customIntegerStringSchema);
  });

  it('returns undefined if passed type is undefined', () => {
    expect(ioTypeToJsonSchema(undefined)).toBe(undefined);
  });

  it('throws an error on unknown io-ts type', () => {
    expect(() => ioTypeToJsonSchema({
      _tag: 'this is not a valid type'
    } as any)).toThrow('Unsupported type');
  });
});

describe('#withJsonSchema', () => {
  it('adds custom metadata to io-ts type', () => {
    const integerString = customIntegerStringType();

    expect((integerString as any)._tag).toBeUndefined();
    expect(withJsonSchema(integerString, customIntegerStringSchema)).toBe(integerString);

    expect(integerString).toHaveProperty('_tag', 'CustomJsonSchemaType');
    expect(integerString).toHaveProperty('jsonSchema', customIntegerStringSchema);
  });
});
