import { HttpStatus, internal } from '@marblejs/core';
import * as request from 'supertest';
import { app } from '../src/app';

const { ContentType } = internal;

describe('API integration', () => {
  test('POST returns 404 when route not found: /', async () =>
    request(app)
      .post('/')
      .expect(404));

  test('GET returns status 200: /api/v1', async () =>
    request(app)
      .get('/api/v1')
      .expect(200, '"API version: v1"'));

  test('GET returns status 200: /api/v2', async () =>
    request(app)
      .get('/api/v2')
      .expect(200, '"API version: v2"'));

  // @TODO: fix an error with `*` after placeholder path
  xtest('GET: /api/v1/foo triggers 404 effect', async () =>
    request(app)
      .get('/api/v1/foo')
      .expect(404, {
        error: {
          message: 'Route not found',
          status: 404,
        }
      }));

  test('GET returns error response: /api/v1/error', async () =>
    request(app)
      .get('/api/v1/error')
      .expect(HttpStatus.NOT_IMPLEMENTED, {
        error: {
          status: HttpStatus.NOT_IMPLEMENTED,
          data: { reason: 'Not implemented' },
          message: 'Route not implemented',
        }
      }));

  test('GET returns collection: /api/v1/user', async () =>
    request(app)
      .get('/api/v1/user')
      .set('Authorization', 'Bearer FAKE')
      .expect(200)
      .then(({ body }) => {
        expect(body).toHaveLength(3);
      }));

  test('GET returns single object: /api/v1/user/10', async () =>
    request(app)
      .get('/api/v1/user/10')
      .set('Authorization', 'Bearer FAKE')
      .expect(200)
      .then(({ body }) => {
        expect(body.id).toEqual('10');
      }));

  test('parses POST body and returns echo for secured route: /api/v1/user', async () =>
    request(app)
      .post('/api/v1/user')
      .set('Authorization', 'Bearer FAKE')
      .send({ test: 'test' })
      .expect(200, { data: {test: 'test' } }));

  test(`returns static file as ${ContentType.TEXT_HTML}: /api/v1/static/index.html`, async () =>
    request(app)
      .get('/api/v1/static/index.html')
      .expect('Content-Type', ContentType.TEXT_HTML)
      .then(res => expect(res.text).toContain('<h1>Test</h1>')));

});
