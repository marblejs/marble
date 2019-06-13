import * as request from 'supertest';
import { server as httpServer } from '../src/messaging/client';
import { microservice as messagingServer } from '../src/messaging/server';

const microservice = messagingServer.run();

beforeAll(() => microservice);

describe('messaging integration', () => {
  test('GET /fib returns 10, 11, 12, 13, 14 th fibonacci number', async () =>
    request(httpServer.server)
      .get('/fib/10')
      .expect(200, [
        { type: 'FIB_RESULT', payload: 55 },
        { type: 'FIB_RESULT', payload: 89 },
        { type: 'FIB_RESULT', payload: 144 },
        { type: 'FIB_RESULT', payload: 233 },
        { type: 'FIB_RESULT', payload: 377 },
      ]));
});

afterAll(() => microservice.then(con => con.close()));
