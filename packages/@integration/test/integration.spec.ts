import * as request from 'supertest';
import { HttpStatus } from '@marblejs/core';
import { ContentType } from '@marblejs/core/dist/+internal';
import { server as marbleServer } from '../src';

const { server } = marbleServer;

describe('API integration', () => {
  test('POST returns 404 when route not found: /', async () =>
    request(server)
      .post('/')
      .expect(404));

  test('GET returns status 200: /api/v1', async () =>
    request(server)
      .get('/api/v1')
      .expect(200, '"API version: v1"'));

  test('GET returns status 200: /api/v2', async () =>
    request(server)
      .get('/api/v2')
      .expect(200, '"API version: v2"'));

  test('GET returns status 400: /api/v3 if provided version is not supported', async () =>
    request(server)
      .get('/api/v3')
      .expect(400, {
        error: {
          status: 400,
          message: 'Validation error',
          data: [{
            path : 'version.0',
            expected: '"v1"',
            got: '"v3"'
          }, {
            path: 'version.1',
            expected: '"v2"',
            got: '"v3"'
          }],
          context: 'params'
        }
      }));

  test('GET: /api/v1/foo triggers 404 effect', async () =>
    request(server)
      .get('/api/v1/foo')
      .expect(404, {
        error: {
          message: 'Route not found',
          status: 404,
        }
      }));

  test('GET returns error response: /api/v1/error', async () =>
    request(server)
      .get('/api/v1/error')
      .expect(HttpStatus.NOT_IMPLEMENTED, {
        error: {
          status: HttpStatus.NOT_IMPLEMENTED,
          data: { reason: 'Not implemented' },
          message: 'Route not implemented',
        }
      }));

  test('GET returns collection: /api/v1/user', async () =>
    request(server)
      .get('/api/v1/user')
      .set('Authorization', 'Bearer FAKE')
      .expect(200)
      .then(({ body }) => {
        expect(body).toHaveLength(3);
      }));

  test('GET returns single object: /api/v1/user/10', async () =>
    request(server)
      .get('/api/v1/user/10')
      .set('Authorization', 'Bearer FAKE')
      .expect(200)
      .then(({ body }) => {
        expect(body.id).toEqual('10');
      }));

  test('GET returns 404 not found: /api/v1/user/0', async () =>
    request(server)
      .get('/api/v1/user/0')
      .set('Authorization', 'Bearer FAKE')
      .expect(404, { error: { status: 404, message: 'User does not exist' } }));

  test('GET returns 401 if not authorized: /api/v1/user/10', async () =>
    request(server)
      .get('/api/v1/user/10')
      .expect(401, { error: { status: 401, message: 'Unauthorized' } }));

  test('parses POST body and returns echo for secured route: /api/v1/user', async () =>
    request(server)
      .post('/api/v1/user')
      .set('Authorization', 'Bearer FAKE')
      .send({ user: { id: 'test_id' } })
      .expect(200, { data: { user: { id: 'test_id' } } }));

  // tslint:disable-next-line:max-line-length
  test(`parses POST ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} body and echoes back for secured route: /api/v1/user`, async () =>
    request(server)
      .post('/api/v1/user')
      .set('Authorization', 'Bearer FAKE')
      .set('Content-Type', ContentType.APPLICATION_X_WWW_FORM_URLENCODED)
      .send({ user: { id: 'test_id' } })
      .expect(200, { data: { user: { id: 'test_id' } } }));

  test(`returns static file as ${ContentType.TEXT_HTML}: /api/v1/static/index.html`, async () =>
    request(server)
      .get('/api/v1/static/index.html')
      .expect('Content-Type', ContentType.TEXT_HTML)
      .then(res => expect(res.text).toContain('<h1>Test</h1>')));

  test(`returns static file as ${ContentType.IMAGE_PNG}: /api/v1/static/img/flow.png`, async () =>
    request(server)
      .get('/api/v1/static/img/flow.png')
      .expect('Content-Type', ContentType.IMAGE_PNG));

  test(`OPTIONS returns 204`, async () =>
    request(server)
      .options('/api/v2')
      .set('origin', 'fake-origin')
      .expect('Access-Control-Allow-Methods', 'HEAD, GET, POST, PUT, PATCH, DELETE, OPTIONS')
      .expect('Access-Control-Allow-Origin', 'fake-origin')
      .expect('Access-Control-Allow-Headers', 'Authorization, X-Header')
      .expect('Access-Control-Max-Age', '36000')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect(204));

  test(`GET returns 200`, async () =>
    request(server)
      .get('/api/v2')
      .set('origin', 'fake-origin')
      .expect('Access-Control-Allow-Origin', 'fake-origin')
      .expect(200));
});
