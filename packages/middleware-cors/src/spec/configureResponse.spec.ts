import { createHttpResponse } from '@marblejs/http/dist/+internal/testing.util';
import { configureResponse } from '../configureResponse';
import { CORSOptions } from '../middleware';
import { createMockRequest } from '../util';

describe('configureResponse', () => {
  test('should configure response correctly', done => {
    const origin = 'fake-origin';
    const req = createMockRequest('GET', { origin });
    const res = createHttpResponse();
    const options: CORSOptions = {
      origin: 'fake-origin',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      withCredentials: true,
      optionsSuccessStatus: 204,
      allowHeaders: '*',
      maxAge: 3600,
      exposeHeaders: ['x-header', 'x-custom-header'],
    };

    configureResponse(req, res, options);

    expect(res.setHeader).toBeCalledTimes(3);
    expect(res.setHeader).toBeCalledWith(
      'Access-Control-Allow-Origin',
      'fake-origin',
    );
    expect(res.setHeader).toBeCalledWith(
      'Access-Control-Allow-Credentials',
      'true',
    );
    expect(res.setHeader).toBeCalledWith(
      'Access-Control-Expose-Headers',
      'X-Header, X-Custom-Header',
    );
    done();
  });

  test('should configure response correctly', done => {
    const origin = 'fake-origin';
    const req = createMockRequest('GET', { origin });
    const res = createHttpResponse();
    const options: CORSOptions = {
      origin: 'fake-origin',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      withCredentials: false,
      optionsSuccessStatus: 204,
      allowHeaders: '*',
      maxAge: 3600,
    };

    configureResponse(req, res, options);

    expect(res.setHeader).toBeCalledTimes(1);
    expect(res.setHeader).toBeCalledWith(
      'Access-Control-Allow-Origin',
      'fake-origin',
    );
    expect(res.setHeader).not.toBeCalledWith(
      'Access-Control-Allow-Credentials',
    );
    expect(res.setHeader).not.toBeCalledWith('Access-Control-Expose-Headers');
    done();
  });
});

