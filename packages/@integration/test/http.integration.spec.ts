import { pipe } from 'fp-ts/lib/pipeable';
import { HttpStatus } from '@marblejs/core';
import { ContentType } from '@marblejs/core/dist/+internal/http';
import { createHttpTestBed, createTestBedSetup } from '@marblejs/testing';
import { listener } from '../src/http';

const useTestBedSetup = createTestBedSetup({
  testBed: createHttpTestBed({ listener }),
});

describe('API integration', () => {
  const testBedSetup = useTestBedSetup()

  afterEach(() => testBedSetup.cleanup());

  test('POST "/" returns 404 when route not found', async () => {
    const testBed = await testBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('POST'),
      testBed.withPath('/'),
      testBed.send,
    );

    expect(response.statusCode).toEqual(404);
    expect(response.body.error).toEqual({
      message: 'Route not found',
      status: 404,
    });
  });

  test('GET "/api/v1" returns status 200', async () => {
    const testBed = await testBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath('/api/v1'),
      testBed.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual('API version: v1');
  });

  test('GET "/api/v2" returns status 200', async () => {
    const testBed = await testBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath('/api/v2'),
      testBed.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual('API version: v2');
  });

  test('GET "/api/v3" returns status 400 if provided version is not supported', async () => {
    const testBed = await testBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath('/api/v3'),
      testBed.send,
    );

    expect(response.statusCode).toEqual(400);
    expect(response.body.error).toEqual({
      status: 400,
      message: 'Validation error',
      data: [{
        path : 'version.0',
        expected: '"v1"',
        got: '"v3"'
      }, {
        path: 'version.1',
        expected: '"v2"',
        got: '"v3"'
      }],
      context: 'params'
    });
  });

  test('GET "/api/v1/foo" triggers 404 effect', async () => {
    const testBed = await testBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath('/api/v1/foo'),
      testBed.send,
    );

    expect(response.statusCode).toEqual(404);
    expect(response.body.error).toEqual({
      message: 'Route not found',
      status: 404,
    });
  });

  test('GET "/api/v1/error" returns error response', async () => {
    const testBed = await testBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath('/api/v1/error'),
      testBed.send,
    );

    expect(response.statusCode).toEqual(HttpStatus.NOT_IMPLEMENTED);
    expect(response.body.error).toEqual({
      message: 'Route not implemented',
      data: { reason: 'Not implemented' },
      status: HttpStatus.NOT_IMPLEMENTED,
    });
  });

  test('GET "/api/v1/user" returns collection', async () => {
    const testBed = await testBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath('/api/v1/user'),
      testBed.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      testBed.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveLength(3);
  });

  test(`GET "/api/v1/user?email=test%40test.com" returns 200 with "Content-Type": "application/json" `, async () => {
    const testBed = await testBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath('/api/v1/user?email=test%40test.com'),
      testBed.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      testBed.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.headers['content-type']).toBe(ContentType.APPLICATION_JSON);
  });

  test(`GET "/api/v1/user/10" returns single object`, async () => {
    const testBed = await testBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath('/api/v1/user/10'),
      testBed.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      testBed.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body.id).toEqual('10');
  });

  test('GET "/api/v1/user/0" returns 404 not found', async () => {
    const testBed = await testBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath('/api/v1/user/0'),
      testBed.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      testBed.send,
    );

    expect(response.statusCode).toEqual(404);
    expect(response.body.error).toEqual({
      status: 404,
      message: 'User does not exist',
    });
  });

  test('GET "/api/v1/user/10" returns 401 if not authorized', async () => {
    const testBed = await testBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath('/api/v1/user/0'),
      testBed.send,
    );

    expect(response.statusCode).toEqual(401);
    expect(response.body.error).toEqual({
      status: 401,
      message: 'Unauthorized',
    });
  });

  test('POST "/api/v1/user" parses body and returns echo for secured route', async () => {
    const testBed = await testBedSetup.useTestBed();
    const data = { user: { id: 'test_id' } };

    const response = await pipe(
      testBed.req('POST'),
      testBed.withPath('/api/v1/user'),
      testBed.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      testBed.withBody(data),
      testBed.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ data });
  });

  test(`POST "/api/v1/user" parses ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} body and echoes back for secured route`, async () => {
    const testBed = await testBedSetup.useTestBed();
    const data = { user: { id: 'test_id' } };

    const response = await pipe(
      testBed.req('POST'),
      testBed.withPath('/api/v1/user'),
      testBed.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      testBed.withHeaders({ 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED }),
      testBed.withBody(data),
      testBed.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ data });
  });

  describe('files', () => {
    test(`GET "/api/v1/static/index.html" returns static file as "${ContentType.TEXT_HTML}"`, async () => {
      const testBed = await testBedSetup.useTestBed();

      const response = await pipe(
        testBed.req('GET'),
        testBed.withPath('/api/v1/static/index.html'),
        testBed.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.headers['content-type']).toEqual(ContentType.TEXT_HTML);
      expect(response.body).toContain('<h1>Test</h1>');
    });

    test(`GET "/api/v1/static/img/flow.png" returns static file as "${ContentType.IMAGE_PNG}"`, async () => {
      const testBed = await testBedSetup.useTestBed();

      const response = await pipe(
        testBed.req('GET'),
        testBed.withPath('/api/v1/static/img/flow.png'),
        testBed.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.headers['content-type']).toEqual(ContentType.IMAGE_PNG);
    });
  })

  describe('CORS', () => {
    test('OPTIONS "/api/v2" returns 204', async () => {
      const testBed = await testBedSetup.useTestBed();

      const response = await pipe(
        testBed.req('OPTIONS'),
        testBed.withPath('/api/v2'),
        testBed.withHeaders({ 'Origin': 'fake-origin' }),
        testBed.send,
      );

      expect(response.statusCode).toEqual(204);
      expect(response.headers['access-control-allow-methods']).toEqual('HEAD, GET, POST, PUT, PATCH, DELETE, OPTIONS');
      expect(response.headers['access-control-allow-origin']).toEqual('fake-origin');
      expect(response.headers['access-control-allow-headers']).toEqual('Authorization, X-Header');
      expect(response.headers['access-control-allow-credentials']).toEqual('true');
      expect(response.headers['access-control-max-age']).toEqual('36000');
    });

    test('GET "/api/v2" returns 200', async () => {
      const testBed = await testBedSetup.useTestBed();

      const response = await pipe(
        testBed.req('GET'),
        testBed.withPath('/api/v2'),
        testBed.withHeaders({ 'Origin': 'fake-origin' }),
        testBed.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.headers['access-control-allow-origin']).toEqual('fake-origin');
    });
  });
});
