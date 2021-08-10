import { pipe } from 'fp-ts/lib/function';
import { HttpStatus } from '@marblejs/http';
import { ContentType } from '@marblejs/http/dist/+internal/contentType.util';
import { createHttpTestBed, createTestBedSetup } from '@marblejs/testing';
import { listener } from '../src/http';

const useTestBedSetup = createTestBedSetup({
  testBed: createHttpTestBed({ listener }),
});

describe('API integration', () => {
  const testBedSetup = useTestBedSetup();

  afterEach(testBedSetup.cleanup);

  test('POST "/" returns 404 when route not found', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('POST'),
      request.withPath('/'),
      request.send,
    );

    expect(response.statusCode).toEqual(404);
    expect(response.body.error).toEqual({
      message: 'Route not found',
      status: 404,
    });
  });

  test('GET "/api/v1" returns status 200', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/v1'),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual('API version: v1');
  });

  test('GET "/api/v2" returns status 200', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/v2'),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual('API version: v2');
  });

  test('GET "/api/v3" returns status 400 if provided version is not supported', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/v3'),
      request.send,
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
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/v1/foo'),
      request.send,
    );

    expect(response.statusCode).toEqual(404);
    expect(response.body.error).toEqual({
      message: 'Route not found',
      status: 404,
    });
  });

  test('GET "/api/v1/error" returns error response', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/v1/error'),
      request.send,
    );

    expect(response.statusCode).toEqual(HttpStatus.NOT_IMPLEMENTED);
    expect(response.body.error).toEqual({
      message: 'Route not implemented',
      data: { reason: 'Not implemented' },
      status: HttpStatus.NOT_IMPLEMENTED,
    });
  });

  test('GET "/api/v1/user" returns collection', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/v1/user'),
      request.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveLength(3);
  });

  test(`GET "/api/v1/user?email=test%40test.com" returns 200 with "Content-Type": "application/json" `, async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/v1/user?email=test%40test.com'),
      request.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.headers['content-type']).toBe(ContentType.APPLICATION_JSON);
  });

  test(`GET "/api/v1/user/10" returns single object`, async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/v1/user/10'),
      request.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body.id).toEqual('10');
  });

  test('GET "/api/v1/user/0" returns 404 not found', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/v1/user/0'),
      request.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      request.send,
    );

    expect(response.statusCode).toEqual(404);
    expect(response.body.error).toEqual({
      status: 404,
      message: 'User does not exist',
    });
  });

  test('GET "/api/v1/user/10" returns 401 if not authorized', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/v1/user/0'),
      request.send,
    );

    expect(response.statusCode).toEqual(401);
    expect(response.body.error).toEqual({
      status: 401,
      message: 'Unauthorized',
    });
  });

  test('POST "/api/v1/user" parses body and returns echo for secured route', async () => {
    const { request } = await testBedSetup.useTestBed();
    const data = { user: { id: 'test_id' } };

    const response = await pipe(
      request('POST'),
      request.withPath('/api/v1/user'),
      request.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      request.withBody(data),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ data });
  });

  test(`POST "/api/v1/user" parses ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} body and echoes back for secured route`, async () => {
    const { request } = await testBedSetup.useTestBed();
    const data = { user: { id: 'test_id' } };

    const response = await pipe(
      request('POST'),
      request.withPath('/api/v1/user'),
      request.withHeaders({ 'Authorization': 'Bearer FAKE' }),
      request.withHeaders({ 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED }),
      request.withBody(data),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ data });
  });

  describe('files', () => {
    test(`GET "/api/v1/static/index.html" returns static file as "${ContentType.TEXT_HTML}"`, async () => {
      const { request } = await testBedSetup.useTestBed();

      const response = await pipe(
        request('GET'),
        request.withPath('/api/v1/static/index.html'),
        request.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.headers['content-type']).toEqual(ContentType.TEXT_HTML);
      expect(response.body).toContain('<h1>Test</h1>');
    });

    test(`GET "/api/v1/static/img/flow.png" returns static file as "${ContentType.IMAGE_PNG}"`, async () => {
      const { request } = await testBedSetup.useTestBed();

      const response = await pipe(
        request('GET'),
        request.withPath('/api/v1/static/img/flow.png'),
        request.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.headers['content-type']).toEqual(ContentType.IMAGE_PNG);
    });
  });

  describe('CORS', () => {
    test('OPTIONS "/api/v2" returns 204', async () => {
      const { request } = await testBedSetup.useTestBed();

      const response = await pipe(
        request('OPTIONS'),
        request.withPath('/api/v2'),
        request.withHeaders({ 'Origin': 'fake-origin' }),
        request.send,
      );

      expect(response.statusCode).toEqual(204);
      expect(response.headers['access-control-allow-methods']).toEqual('HEAD, GET, POST, PUT, PATCH, DELETE, OPTIONS');
      expect(response.headers['access-control-allow-origin']).toEqual('fake-origin');
      expect(response.headers['access-control-allow-headers']).toEqual('Authorization, X-Header');
      expect(response.headers['access-control-allow-credentials']).toEqual('true');
      expect(response.headers['access-control-max-age']).toEqual('36000');
    });

    test('GET "/api/v2" returns 200', async () => {
      const { request } = await testBedSetup.useTestBed();

      const response = await pipe(
        request('GET'),
        request.withPath('/api/v2'),
        request.withHeaders({ 'Origin': 'fake-origin' }),
        request.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.headers['access-control-allow-origin']).toEqual('fake-origin');
    });
  });
});
