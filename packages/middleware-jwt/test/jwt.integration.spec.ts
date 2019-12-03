import * as request from 'supertest';
import { verifyToken } from '../src';
import { app, SECRET_KEY } from './jwt.integration';
import { HttpServer, createServer } from '@marblejs/core';

const LOGIN_CREDENTIALS = { email: 'admin@admin.com', password: 'admin' };

describe('@marblejs/middleware-jwt - HTTP integration', () => {
  let httpServer: HttpServer;

  beforeEach(async () => {
    httpServer = await createServer({ httpListener: app })();
  });

  test('POST /api/login returns token and verifies its correctness', async () =>
    request(httpServer)
      .post('/api/login')
      .send(LOGIN_CREDENTIALS)
      .expect(200)
      .then(req => {
        const { token } = req.body;
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

        const payload = verifyToken<any>({ secret: SECRET_KEY })(token);
        expect(payload.id).toEqual('test_id');
        expect(payload.email).toEqual('admin@admin.com');
      }));

    test('GET /api/secured authorizes request and checks the `req.user` object', async () => {
      const token = await request(httpServer)
        .post('/api/login')
        .send(LOGIN_CREDENTIALS)
        .expect(200)
        .then(req => req.body.token as string);

      return request(httpServer)
        .get('/api/secured')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .then(req => {
          const user = req.body;
          expect(user.id).toEqual('test_id');
          expect(user.email).toEqual(LOGIN_CREDENTIALS.email);
          expect(user.password).toBeUndefined();
        });
    });

    test('GET /api/secured return 401 if payload doesn\'t pass verification', async () => {
      const token = await request(httpServer)
        .post('/api/login')
        .send({ ...LOGIN_CREDENTIALS, email: 'doesnt_exists@admin.com' })
        .expect(200)
        .then(req => req.body.token as string);

      return request(httpServer)
        .get('/api/secured')
        .set('Authorization', `Bearer ${token}`)
        .expect(401, { error: { status: 401, message: 'Unauthorized' } });
    });

    test('GET /api/secured returns 401 if token is wrong', async () =>
      request(httpServer)
        .get('/api/secured')
        .set('Authorization', `Bearer WRONG_TOKEN`)
        .expect(401, { error: { status: 401, message: 'Unauthorized' } }));
});
