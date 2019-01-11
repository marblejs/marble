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
        expect(error.context).toEqual('headers'),
        expect(error.data).toEqual([{
          expected: '"application/json"',
          got: '"text/plain"',
          path: 'content-type',
        }]);
        done();
      },
    );
  });
});
