import { server } from '../helpers/api.spec-util';
import * as request from 'supertest';

describe('Joi middleware - Integration', () => {
  const app = server();
  const token = '181782881DB38D84';

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(jest.fn);
  });

  it('should fail without a token', async () => {
    const expected = {
      error: {
        status: 400,
        message: '"token" is required'
      }
    };

    return request(app)
      .get('/api/user/1')
      .then(res => expect(res.body).toEqual(expected));
  });

  it('should send a get request with parameters', async () => {
    return request(app)
      .get('/api/user/1')
      .set('token', token)
      .expect(200, { id: 1 });
  });

  it('should send a get request with an invalid param', async () => {
    const expected = {
      error: {
        status: 400,
        message: '"id" must be less than or equal to 10'
      }
    };

    return request(app)
      .get('/api/user/11')
      .set('token', token)
      .then(res => expect(res.body).toEqual(expected));
  });

  it('should send a get request with query', async () => {
    return request(app)
      .get('/api/post?page=2')
      .set('token', token)
      .expect(200, { page: 2 });
  });

  it('should send a post request with body', async () => {
    return request(app)
      .post('/api/user')
      .set('token', token)
      .send({ name: 'lucio' })
      .expect(200, { name: 'lucio', passport: 'marble.js' });
  });

  it('should send a post request with query and body', async () => {
    const time = Date.now();
    return request(app)
      .post(`/api/post?timestamp=${time}`)
      .set('token', token)
      .send({ title: 'Middleware Joi' })
      .expect(200, { title: 'Middleware Joi', timestamp: new Date(time).toISOString() });
  });
});
