import { createHttpTestBed, createTestBedSetup } from '@marblejs/testing';
import { pipe } from 'fp-ts/lib/pipeable';
import { listener } from '../helpers/api.spec-util';

const testBed = createHttpTestBed({ listener });
const useTestBedSetup = createTestBedSetup({ testBed });

describe('Joi middleware - Integration', () => {
  const token = '181782881DB38D84';
  const testBedSetup = useTestBedSetup();

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(jest.fn);
  });

  afterEach(async () => {
    await testBedSetup.cleanup();
  });

  test('fails without a token', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/user/1'),
      request.send,
    );

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      error: {
        status: 400,
        message: '"token" is required',
      }
    });
  });

  test('sends GET request with parameters', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/user/1'),
      request.withHeaders({ 'token': token }),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ id: 1 });
  });

  test('sends GET request with an invalid param', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/user/11'),
      request.withHeaders({ 'token': token }),
      request.send,
    );

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      error: {
        status: 400,
        message: '"id" must be less than or equal to 10',
      }
    });
  });

  test('sends GET request with query', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('GET'),
      request.withPath('/api/post?page=2'),
      request.withHeaders({ 'token': token }),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ page: 2 });
  });

  test('sends POST request with body', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('POST'),
      request.withPath('/api/user'),
      request.withHeaders({ 'token': token }),
      request.withBody({ name: 'lucio', passport: 'marble.js' }),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ name: 'lucio', passport: 'marble.js' });
  });

  test('sends POST request with query and body', async () => {
    const time = Date.now();
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('POST'),
      request.withPath(`/api/post?timestamp=${time}`),
      request.withHeaders({ 'token': token }),
      request.withBody({ title: 'Middleware Joi' }),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ title: 'Middleware Joi', timestamp: new Date(time).toISOString() });
  });
});
