import { pipe } from 'fp-ts/lib/pipeable';
import { createTestBedSetup, createHttpTestBed } from '@marblejs/testing';
import { createMicroserviceTestBed } from '@marblejs/messaging/dist/+internal/testing';
import { dependencies, listener } from '../src/messaging/client';
import { amqpMicroservice, redisMicroservice } from '../src/messaging/server';

const useHttpTestBedSetup = createTestBedSetup({
  dependencies,
  testBed: createHttpTestBed({ listener }),
});

describe('messaging integration', () => {
  const httpTestBedSetup = useHttpTestBedSetup();

  afterEach(httpTestBedSetup.cleanup);

  createMicroserviceTestBed(redisMicroservice);
  createMicroserviceTestBed(amqpMicroservice);

  test.each([
    'redis',
    'amqp',
  ])('GET /%s/fib returns 10, 11, 12, 13, 14 th fibonacci number', async type => {
    const testBed = await httpTestBedSetup.useTestBed();

    const response = await pipe(
      testBed.req('GET'),
      testBed.withPath(`/${type}/fib/10`),
      testBed.send,
    );

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual([
      { type: 'FIB_RESULT', payload: 55 },
      { type: 'FIB_RESULT', payload: 89 },
      { type: 'FIB_RESULT', payload: 144 },
      { type: 'FIB_RESULT', payload: 233 },
      { type: 'FIB_RESULT', payload: 377 },
    ]);
  });
});
