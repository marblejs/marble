import * as t from 'io-ts';
import { of } from 'rxjs';
import { HttpError, HttpStatus } from '@marblejs/core';
import { createHttpRequest } from '@marblejs/core/dist/+internal/testing';
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
    stream$.subscribe(
      outgoingData => {
        expect(outgoingData.body).toEqual(input.body);
        expect(outgoingData.params).toEqual(input.params);
        expect(outgoingData.query).toEqual(input.query);
        expect(outgoingData.headers).toEqual(input.headers);
        done();
      },
      (error: HttpError) => {
        fail(error.data);
        done();
      },
    );
  });

  test('applies JSON schema when testing is enabled', done => {
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
    const stream$ = requestValidator$({
      body: defaultSchema,
      params: defaultSchema,
      query: defaultSchema,
      headers: headersSchema,
    })(of(input));

    // then
    stream$.subscribe(
      outgoingData => {
        delete process.env.MARBLE_TESTING_METADATA_ON;
        expect(outgoingData.meta).toEqual({
            body: {
              properties: { test: { type: 'string' } },
              required: ['test'],
              type: 'object',
              additionalProperties: true,
            },
            headers: {
              properties: { 'content-type': { const: 'application/json' } },
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
          }
        );
        done();
      },
      (error: HttpError) => {
        fail(error.data);
        done();
      },
    );
  });

  test('updates values when valid', done => {
    // given
    const numberFromString = new t.Type<number, string, unknown>(
      'NumberFromStringCodec',
      t.number.is,
      (u: unknown, c: t.Context) => {
        const validation = t.string.validate(u, c);

        if (validation.isLeft() || u === '') {
          return t.failure(u, c);
        }

        const s = validation.value;
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
    stream$.subscribe(
      outgoingData => {
        expect(outgoingData.query.test).toBe(1);
        done();
      },
      (error: HttpError) => {
        fail(error.data);
        done();
      },
    );
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
    stream$.subscribe(
      () => {
        fail('Datas should\'t be returned');
        done();
      },
      (error: HttpError) => {
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
    );
  });
});
