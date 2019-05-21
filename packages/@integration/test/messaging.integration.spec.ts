import * as request from 'supertest';
import { server as httpServer } from '../src/messaging/client';
import { server as messagingServer } from '../src/messaging/server';
import { createContext } from '@marblejs/core';

const microservice = messagingServer.run(createContext());

beforeAll(() => microservice);

describe('messaging integration', () => {
  test('GET /fib returns 10th fibonacci number', async () =>
    request(httpServer.server)
      .get('/fib')
      .expect(200, [
        { type: 'FIB_RESULT', payload: 55 },
        { type: 'FIB_RESULT', payload: 55 },
      ]));
});

afterAll(() => microservice.then(s => s.close()));
