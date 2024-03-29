import * as t from 'io-ts';
import { of } from 'rxjs';
import { isLeft, getOrElse } from 'fp-ts/lib/Either';
import { HttpError, HttpStatus, MARBLE_HTTP_REQUEST_METADATA_ENV_KEY } from '@marblejs/http';
import { createHttpRequest } from '@marblejs/http/dist/+internal/testing.util';
import { requestValidator$ } from '../io.request.middleware';

describe('#requestValidator$', () => {
  test('validates request body, params, query, headers', done => {
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
    const stream$ = requestValidator$({
      body: defaultSchema,
      params: defaultSchema,
      query: defaultSchema,
      headers: headersSchema,
    })(of(input));

    // then
    stream$.subscribe({
      next: outgoingData => {
        expect(outgoingData.body).toEqual(input.body);
        expect(outgoingData.params).toEqual(input.params);
        expect(outgoingData.query).toEqual(input.query);
        expect(outgoingData.headers).toEqual(input.headers);
        done();
      },
      error: (err: HttpError) => fail(err.data),
    });
  });

  test('applies JSON schema when testing is enabled', done => {
    // given
    process.env[MARBLE_HTTP_REQUEST_METADATA_ENV_KEY] = 'true';
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
    const stream$ = requestValidator$({
      body: defaultSchema,
      params: defaultSchema,
      query: defaultSchema,
      headers: headersSchema,
    })(of(input));

    // then
    stream$.subscribe({
      next: outgoingData => {
        delete process.env[MARBLE_HTTP_REQUEST_METADATA_ENV_KEY];
        expect(outgoingData.meta).toEqual({
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
        done();
      },
      error: (err: HttpError) => fail(err.data),
    });
  });

  test('updates values when valid', done => {
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
    const stream$ = requestValidator$({ query: schema })(of(input));

    // then
    stream$.subscribe({
      next: outgoingData => {
        expect(outgoingData.query.test).toBe(1);
        done();
      },
      error: (err: HttpError) => fail(err.data),
    });
  });

  test('throws HttpError error if incoming data are not valid', done => {
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
    const stream$ = requestValidator$({
      body: defaultSchema,
      params: defaultSchema,
      query: defaultSchema,
      headers: headersSchema,
    })(of(input));

    // then
    stream$.subscribe({
      next: () => fail('Datas should\'t be returned'),
      error: (error: HttpError) => {
        expect(error.message).toEqual('Validation error');
        expect(error.status).toEqual(HttpStatus.BAD_REQUEST);
        expect(error.context).toEqual('headers');
        expect(error.data).toEqual([
          {
            expected: '"application/json"',
            got: '"text/plain"',
            path: 'content-type',
          }
        ]);
        done();
      },
    });
  });
});
