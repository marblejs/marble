import { createHttpTestBed, createTestBedSetup } from '@marblejs/testing';
import { pipe } from 'fp-ts/lib/pipeable';
import { verifyToken } from '../src';
import { listener, SECRET_KEY } from './jwt.integration';

const testBed = createHttpTestBed({ listener });
const useTestBedSetup = createTestBedSetup({ testBed });
const LOGIN_CREDENTIALS = { email: 'admin@admin.com', password: 'admin' };

describe('@marblejs/middleware-jwt - HTTP integration', () => {
  const testBedSetup = useTestBedSetup();

  afterEach(async () => {
    await testBedSetup.cleanup();
  });

  test('POST "/api/login" returns token and verifies its correctness', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('POST'),
      request.withPath('/api/login'),
      request.withBody(LOGIN_CREDENTIALS),
      request.send,
    );

    expect(response.body).toEqual({ token: expect.any(String) });

    const { token } = response.body;
    const payload = verifyToken<any>({ secret: SECRET_KEY })(token);

    expect(payload.id).toEqual('test_id');
    expect(payload.email).toEqual('admin@admin.com');
  });

  test('GET "/api/secured" authorizes request and checks the `req.user` object', async () => {
    const { request } = await testBedSetup.useTestBed();

    const responseWithToken = await pipe(
      request('POST'),
      request.withPath('/api/login'),
      request.withBody(LOGIN_CREDENTIALS),
      request.send,
    );

    const { token } = responseWithToken.body;

    const responseAuthorized = await pipe(
      request('GET'),
      request.withPath('/api/secured'),
      request.withHeaders({ 'Authorization': `Beared ${token}` }),
      request.send,
    );

    expect(responseAuthorized.statusCode).toEqual(200);
    expect(responseAuthorized.body).toEqual({
      id: 'test_id',
      email: LOGIN_CREDENTIALS.email,
      iat: expect.any(Number),
    });
  });

  test('GET "/api/secured" return 401 if payload doesn\'t pass verification', async () => {
    const { request } = await testBedSetup.useTestBed();

    const responseWithToken = await pipe(
      request('POST'),
      request.withPath('/api/login'),
      request.withBody({ ...LOGIN_CREDENTIALS, email: 'doesnt_exists@admin.com' }),
      request.send,
    );

    const { token } = responseWithToken.body;

    const responseNotAuthorized = await pipe(
      request('GET'),
      request.withPath('/api/secured'),
      request.withHeaders({ 'Authorization': `Beared ${token}` }),
      request.send,
    );

    expect(responseNotAuthorized.statusCode).toEqual(401);
    expect(responseNotAuthorized.body).toEqual({
      error: {
        status: 401,
        message: 'Unauthorized',
      }
    });
  });

  test('GET "/api/secured" returns 401 if token is wrong', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/secured'),
      request.withHeaders({ 'Authorization': 'Beared WRONG_TOKEN' }),
      request.send,
    );

    expect(response.statusCode).toEqual(401);
    expect(response.body).toEqual({
      error: {
        status: 401,
        message: 'Unauthorized',
      }
    });
  });
});
