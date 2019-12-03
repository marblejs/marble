import * as request from 'supertest';
import { server } from '../src/messaging/client';
import { microservice as messagingServer } from '../src/messaging/server';

describe('messaging integration', () => {
  const microservice = messagingServer();

  beforeAll(() => microservice);
  beforeAll(() => jest.spyOn(console, 'log').mockImplementation());
  beforeAll(() => jest.spyOn(console, 'info').mockImplementation());
  afterAll(() => microservice.then(con => con.close()));

  test('GET /fib returns 10, 11, 12, 13, 14 th fibonacci number', async () => {
    const httpServer = await server();
    return request(httpServer)
      .get('/fib/10')
      .expect(200, [
        { type: 'FIB_RESULT', payload: 55 },
        { type: 'FIB_RESULT', payload: 89 },
        { type: 'FIB_RESULT', payload: 144 },
        { type: 'FIB_RESULT', payload: 233 },
        { type: 'FIB_RESULT', payload: 377 },
      ]);
  });
});

