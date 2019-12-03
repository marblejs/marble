import * as request from 'supertest';
import { createServer, HttpServer } from '@marblejs/core';
import { app } from './io-http.integration';

describe('@marblejs/middleware-io - HTTP integration', () => {
  let server: HttpServer;

  beforeEach(async () => {
    server = await createServer({ httpListener: app })();
  });

  test('POST / returns 200 with user object', async () => {
    const user = { id: 'id', name: 'name', age: 100 };
    return request(server)
      .post('/')
      .send({ user })
      .expect(200, user);
  });

  test('POST / returns 400 with validation error object', async () => {
    const user = { id: 'id', name: 'name', age: '100' };
    return request(server)
      .post('/')
      .send({ user })
      .expect(400)
      .then(({ body: { error } }) => {
        expect(error).toBeDefined();
        expect(error.status).toEqual(400);
        expect(error.message).toEqual('Validation error');
        expect(error.context).toEqual('body');
        expect(error.data).toEqual([{
          path: 'user.age',
          expected: 'number',
          got: '"100"'
        }]);
      });
  });
});
