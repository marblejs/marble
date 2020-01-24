import * as request from 'supertest';
import { createServer } from '@marblejs/core';
import { createHttpServerTestBed } from '@marblejs/core/dist/+internal/testing';
import { listener } from '../helpers/api.spec-util';

describe('Joi middleware - Integration', () => {
  const token = '181782881DB38D84';
  const server = createServer({ listener });
  const httpTestBed = createHttpServerTestBed(server);

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(jest.fn);
  });

  test('should fail without a token', async () => {
    const expected = {
      error: {
        status: 400,
        message: '"token" is required'
      }
    };

    return request(httpTestBed.getInstance())
      .get('/api/user/1')
      .then(res => expect(res.body).toEqual(expected));
  });

  test('should send a get request with parameters', async () => {
    return request(httpTestBed.getInstance())
      .get('/api/user/1')
      .set('token', token)
      .expect(200, { id: 1 });
  });

  test('should send a get request with an invalid param', async () => {
    const expected = {
      error: {
        status: 400,
        message: '"id" must be less than or equal to 10'
      }
    };

    return request(httpTestBed.getInstance())
      .get('/api/user/11')
      .set('token', token)
      .then(res => expect(res.body).toEqual(expected));
  });

  test('should send a get request with query', async () => {
    return request(httpTestBed.getInstance())
      .get('/api/post?page=2')
      .set('token', token)
      .expect(200, { page: 2 });
  });

  test('should send a post request with body', async () => {
    return request(httpTestBed.getInstance())
      .post('/api/user')
      .set('token', token)
      .send({ name: 'lucio' })
      .expect(200, { name: 'lucio', passport: 'marble.js' });
  });

  test('should send a post request with query and body', async () => {
    const time = Date.now();
    return request(httpTestBed.getInstance())
      .post(`/api/post?timestamp=${time}`)
      .set('token', token)
      .send({ title: 'Middleware Joi' })
      .expect(200, { title: 'Middleware Joi', timestamp: new Date(time).toISOString() });
  });
});
