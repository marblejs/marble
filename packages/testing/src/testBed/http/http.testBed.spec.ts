import { pipe } from 'fp-ts/lib/function';
import { httpListener, HttpStatus, r } from '@marblejs/http';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { bodyParser$ } from '@marblejs/middleware-body';
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
    const req = testBed.request('GET');

    expect(req.method).toEqual('GET');
    expect(req.port).toEqual(expect.any(Number));
    expect(req.protocol).toEqual('http:');
    expect(req.host).toEqual('127.0.0.1');
    expect(req.path).toEqual('/');
    expect(req.headers).toEqual(expect.objectContaining({
      ...defaultHeaders,
      'X-Request-Metadata-Id': expect.any(String),
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
    const { request: req, finish } = await createHttpTestBed({ listener })();

    // when
    const response = await pipe(
      req('GET'),
      req.withPath('/test'),
      req.withHeaders({ 'Content-Type': 'application/json' }),
      req.send,
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

    await finish();
  });

  test('creates request with body and sends it', async () => {
    // given
    const validateRequest = requestValidator$({
      body: t.type({ foo: t.string }),
    });

    const test$ = r.pipe(
      r.matchPath('/test'),
      r.matchType('POST'),
      r.useEffect(req$ => req$.pipe(
        validateRequest,
        map(req => ({ body: req.body })),
      )));

    const listener = httpListener({
      effects: [test$],
      middlewares: [bodyParser$()],
    });

    const { request, finish } = await createHttpTestBed({ listener })();

    // when
    const response = await pipe(
      request('POST'),
      request.withPath('/test'),
      request.withHeaders({ 'Content-Type': 'application/json' }),
      request.withBody({ foo: 'bar' }),
      request.send,
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

    await finish();
  });

  test('parses response body to "undefined" if not provided', async () => {
    // given
    const test$ = r.pipe(
      r.matchPath('/test'),
      r.matchType('GET'),
      r.useEffect(req$ => req$.pipe(
        mapTo({ status: HttpStatus.NO_CONTENT }),
      )));

    const listener = httpListener({ effects: [test$] });
    const { request: req, finish } = await createHttpTestBed({ listener })();

    // when
    const response = await pipe(
      req('GET'),
      req.withPath('/test'),
      req.withHeaders({ 'Content-Type': 'application/json' }),
      req.send,
    );

    // then
    expect(response.req).toEqual(expect.objectContaining({
      method: 'GET',
      path: '/test',
    }));

    expect(response).toEqual(expect.objectContaining({
      body: undefined,
      statusCode: 204,
      statusMessage: 'No Content',
      headers: expect.objectContaining({
        'content-length': '0',
        'content-type': 'application/json',
      }),
    }));

    await finish();
  });
});
