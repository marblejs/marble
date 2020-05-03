import { pipe } from 'fp-ts/lib/pipeable';
import { httpListener, r, use } from '@marblejs/core';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { bodyParser$ } from '@marblejs/middleware-body';
import { TESTING_REQUEST_ID_HEADER } from '@marblejs/core/dist/+internal/testing';
import { mapTo, map } from 'rxjs/operators';
import { TestBedType } from '../testBed.interface';
import { createHttpTestBed } from './http.testBed';

describe('TetBed - HTTP', () => {
  test('creates and closes instance', async () => {
    const listener = httpListener();
    const testBed = await createHttpTestBed({ listener })();

    expect(testBed.type).toEqual(TestBedType.HTTP);

    await testBed.finish();
  });

  test('#testBed.req defines \'GET\' request with default headers', async () => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN',
    };

    const listener = httpListener();
    const testBed = await createHttpTestBed({ listener, defaultHeaders })();
    const req = testBed.req('GET');

    expect(req.method).toEqual('GET');
    expect(req.port).toEqual(expect.any(Number));
    expect(req.protocol).toEqual('http:');
    expect(req.host).toEqual('127.0.0.1');
    expect(req.path).toEqual('/');
    expect(req.headers).toEqual(expect.objectContaining({
      ...defaultHeaders,
      [TESTING_REQUEST_ID_HEADER]: expect.any(String),
    }));

    await testBed.finish();
  });

  test('creates bodyless request and sends it', async () => {
    // given
    const test$ = r.pipe(
      r.matchPath('/test'),
      r.matchType('GET'),
      r.useEffect(req$ => req$.pipe(
        mapTo({ body: { foo: 'bar' } }),
      )));

    const listener = httpListener({ effects: [test$] });
    const testBed = await createHttpTestBed({ listener })();

    // when
    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath('/test'),
      testBed.withHeaders({ 'Content-Type': 'application/json' }),
      testBed.send,
    );

    // then
    expect(response.req).toEqual(expect.objectContaining({
      method: 'GET',
      path: '/test',
    }));

    expect(response.headers).toEqual(expect.objectContaining({
      'content-length': '13',
      'content-type': 'application/json',
    }));

    expect(response).toEqual(expect.objectContaining({
      body: { foo: 'bar' },
      statusCode: 200,
      statusMessage: 'OK',
    }));

    await testBed.finish();
  });

  test('creates request with body and sends it', async () => {
    // given
    const validator$ = requestValidator$({
      body: t.type({ foo: t.string }),
    });

    const test$ = r.pipe(
      r.matchPath('/test'),
      r.matchType('POST'),
      r.useEffect(req$ => req$.pipe(
        use(validator$),
        map(req => ({ body: req.body })),
      )));

    const listener = httpListener({
      effects: [test$],
      middlewares: [bodyParser$()],
    });

    const testBed = await createHttpTestBed({ listener })();

    // when
    const response = await pipe(
      testBed.req('POST'),
      testBed.withPath('/test'),
      testBed.withHeaders({ 'Content-Type': 'application/json' }),
      testBed.withBody({ foo: 'bar' }),
      testBed.send,
    );

    // then
    expect(response.body).toEqual({ foo: 'bar' });
    expect(response.statusCode).toEqual(200);
    expect(response.statusMessage).toEqual('OK');

    expect(response.req).toEqual(expect.objectContaining({
      method: 'POST',
      path: '/test',
    }));

    expect(response.headers).toEqual(expect.objectContaining({
      'content-type': 'application/json',
    }));

    expect(response.metadata.body).toBeDefined();
    expect(response.metadata.path).toBeDefined();
    expect(response.metadata.query).not.toBeDefined();
    expect(response.metadata.params).not.toBeDefined();
    expect(response.metadata.headers).not.toBeDefined();

    await testBed.finish();
  });
});
