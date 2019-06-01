import * as request from 'supertest';
import { server as httpServer } from '../src/messaging/client';
import { microservice as messagingServer } from '../src/messaging/server';

const microservice = messagingServer.run();

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

afterAll(() => microservice.then(con => con.close()));
