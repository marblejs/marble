/* eslint-disable @typescript-eslint/no-unused-vars */

import * as request from 'supertest';
import { createHttpServerTestBed } from '@marblejs/core/dist/+internal/testing';
import { createMicroserviceTestBed } from '@marblejs/messaging/dist/+internal/testing';
import { server } from '../src/messaging/client';
import { amqpMicroservice, redisMicroservice } from '../src/messaging/server';

describe('messaging integration', () => {
  const httpTestBed = createHttpServerTestBed(server);

  createMicroserviceTestBed(amqpMicroservice);
  createMicroserviceTestBed(redisMicroservice);

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
  });

  test.each([
    'redis',
    'amqp',
  ])('GET /%s/fib returns 10, 11, 12, 13, 14 th fibonacci number', async type =>
    request(httpTestBed.getInstance())
      .get(`/${type}/fib/10`)
      .expect(200, [
        { type: 'FIB_RESULT', payload: 55 },
        { type: 'FIB_RESULT', payload: 89 },
        { type: 'FIB_RESULT', payload: 144 },
        { type: 'FIB_RESULT', payload: 233 },
        { type: 'FIB_RESULT', payload: 377 },
      ]));
});
