import { createHttpTestBed, createTestBedSetup } from '@marblejs/testing';
import { pipe } from 'fp-ts/lib/function';
import { listener } from './io-http.integration';

const testBed = createHttpTestBed({ listener });
const useTestBedSetup = createTestBedSetup({ testBed });

describe('@marblejs/middleware-io - HTTP integration', () => {
  const testBedSetup = useTestBedSetup();

  afterEach(async () => {
    await testBedSetup.cleanup();
  });

  test('POST / returns 200 with user object', async () => {
    const { request } = await testBedSetup.useTestBed();
    const user = { id: 'id', name: 'name', age: 100 };

    const response = await pipe(
      request('POST'),
      request.withPath('/'),
      request.withBody({ user }),
      request.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual(user);
  });

  test('POST / returns 400 with validation error object', async () => {
    const { request } = await testBedSetup.useTestBed();
    const user = { id: 'id', name: 'name', age: '100' };

    const response = await pipe(
      request('POST'),
      request.withPath('/'),
      request.withBody({ user }),
      request.send,
    );

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      error: {
        status: 400,
        message: 'Validation error',
        context: 'body',
        data: [{
          path: 'user.age',
          expected: 'number',
          got: '"100"',
        }]
      }
    });
  });
});
