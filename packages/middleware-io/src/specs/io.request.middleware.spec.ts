import * as t from 'io-ts';
import { of } from 'rxjs';
import { isLeft, getOrElse } from 'fp-ts/lib/Either';
import { HttpStatus } from '@marblejs/core';
import { createHttpRequest } from '@marblejs/core/dist/+internal/testing';
import { validateRequest } from '../io.request.middleware';

describe('#validateRequest', () => {
  test('validates request body, params, query, headers', async () => {
    // given
    const defaultSchema = t.type({ test: t.string });
    const headersSchema = t.type({ 'content-type': t.literal('application/json') });
    const input = createHttpRequest({
      url: '/',
      body: { test: 'test' },
      params: { test: 'test' },
      query: { test: 'test' },
      headers: { 'content-type': 'application/json' },
    });

    // when
    const result = await validateRequest({
      body: defaultSchema,
      params: defaultSchema,
      query: defaultSchema,
      headers: headersSchema,
    })(of(input)).toPromise();

    // then
    expect(result.body).toEqual(input.body);
    expect(result.params).toEqual(input.params);
    expect(result.query).toEqual(input.query);
    expect(result.headers).toEqual(input.headers);
  });

  test('applies JSON schema when testing is enabled', async () => {
    // given
    process.env.MARBLE_TESTING_METADATA_ON = 'true';
    const defaultSchema = t.type({ test: t.string });
    const headersSchema = t.type({ 'content-type': t.literal('application/json') });
    const input = createHttpRequest({
      url: '/',
      body: { test: 'test' },
      params: { test: 'test' },
      query: { test: 'test' },
      headers: { 'content-type': 'application/json' },
    });

    // when
    const result = await validateRequest({
      body: defaultSchema,
      params: defaultSchema,
      query: defaultSchema,
      headers: headersSchema,
    })(of(input)).toPromise();

    // then
    delete process.env.MARBLE_TESTING_METADATA_ON;
    expect(result.meta).toEqual({
      body: {
        properties: { test: { type: 'string' } },
        required: ['test'],
        type: 'object',
        additionalProperties: true,
      },
      headers: {
        properties: { 'content-type': { enum: ['application/json'] } },
        required: ['content-type'],
        type: 'object',
        additionalProperties: true
      },
      params: {
        properties: { test: { type: 'string' } },
        required: ['test'],
        type: 'object',
        additionalProperties: true,
      },
      query: {
        properties: { test: { type: 'string' } },
        required: ['test'],
        type: 'object',
        additionalProperties: true,
      },
    });
  });

  test('updates values when valid', async () => {
    // given
    const numberFromString = new t.Type<number, string, unknown>(
      'NumberFromStringCodec',
      t.number.is,
      (u: unknown, c: t.Context) => {
        const validation = t.string.validate(u, c);

        if (isLeft(validation) || u === '') {
          return t.failure(u, c);
        }

        const s = getOrElse(() => '')(validation);
        const n = Number(s);
        return isNaN(n) ? t.failure(s, c) : t.success(n);
      },
      (n: number) => n.toString()
    );

    const schema = t.type({ test: numberFromString });
    const input = createHttpRequest({ url: '/', query: { test: '1' } });

    // when
    const result = await validateRequest({ query: schema })(of(input)).toPromise();

    // then
    expect(result.query.test).toBe(1);
  });

  test('throws HttpError error if incoming data are not valid', async () => {
    // given
    const defaultSchema = t.type({ test: t.string });
    const headersSchema = t.type({ 'content-type': t.literal('application/json') });
    const input = createHttpRequest({
      url: '/',
      body: { test: 'test' },
      params: { test: 'test' },
      query: { test: 'test' },
      headers: { 'content-type': 'text/plain' },
    });

    // when
    const result = validateRequest({
      body: defaultSchema,
      params: defaultSchema,
      query: defaultSchema,
      headers: headersSchema,
    })(of(input)).toPromise();

    // then
    expect(result).rejects.toEqual(expect.objectContaining({
      message: 'Validation error',
      status: HttpStatus.BAD_REQUEST,
      context: 'headers',
      data: [{
        expected: '"application/json"',
        got: '"text/plain"',
        path: 'content-type',
      }],
    }));
  });
});
