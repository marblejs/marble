import { configurePreflightResponse } from '../configurePreflightResponse';
import { CORSOptions } from '../middleware';
import { createMockRequest, createMockResponse } from './middleware.spec';

describe('configurePreflightResponse', () => {
  test('should configure headers correctly', done => {
    const origin = 'fake-origin';
    const req = createMockRequest('OPTIONS', { origin });
    const res = createMockResponse();
    const options: CORSOptions = {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      withCredentials: true,
      optionsSuccessStatus: 204,
      allowHeaders: '*',
      maxAge: 3600,
    };

    configurePreflightResponse(req, res, options);

    expect(res.setHeader).toBeCalledWith(
      'Access-Control-Allow-Origin',
      'fake-origin',
    );
    expect(res.setHeader).toBeCalledWith(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );
    expect(res.statusCode).toEqual(204);
    expect(res.setHeader).toBeCalledWith('Access-Control-Allow-Headers', '*');
    expect(res.setHeader).toBeCalledWith(
      'Access-Control-Allow-Credentials',
      'true',
    );
    expect(res.setHeader).toBeCalledWith('Access-Control-Max-Age', '3600');
    done();
  });

  test('should configure headers correctly', done => {
    const origin = 'fake-origin';
    const req = createMockRequest('OPTIONS', { origin });
    const res = createMockResponse();
    const options: CORSOptions = {
      origin: '*',
      withCredentials: false,
      optionsSuccessStatus: 204,
      allowHeaders: ['x-header'],
    };

    configurePreflightResponse(req, res, options);

    expect(res.setHeader).toBeCalledWith(
      'Access-Control-Allow-Origin',
      'fake-origin',
    );
    expect(res.setHeader).not.toBeCalledWith('Access-Control-Allow-Methods');
    expect(res.statusCode).toEqual(204);
    expect(res.setHeader).toBeCalledWith(
      'Access-Control-Allow-Headers',
      'X-Header',
    );
    expect(res.setHeader).not.toBeCalledWith('Access-Control-Max-Age');
    expect(res.setHeader).not.toBeCalledWith(
      'Access-Control-Allow-Credentials',
    );
    expect(res.setHeader).not.toBeCalledWith('Access-Control-Max-Age');
    done();
  });

  test('should disallow preflight request', done => {
    const origin = 'fake-origin';
    const req = createMockRequest('OPTIONS', { origin });
    const res = createMockResponse();
    const options: CORSOptions = {
      origin: 'another-origin',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      withCredentials: false,
      optionsSuccessStatus: 204,
      allowHeaders: '*',
      maxAge: 3600,
    };

    configurePreflightResponse(req, res, options);

    expect(res.setHeader).not.toBeCalledWith('Access-Control-Allow-Origin');
    expect(res.setHeader).not.toBeCalledWith('Access-Control-Allow-Methods');
    expect(res.setHeader).not.toBeCalledWith(
      'Access-Control-Allow-Credentials',
    );
    expect(res.setHeader).not.toBeCalledWith('Access-Control-Allow-Headers');
    expect(res.setHeader).not.toBeCalledWith('Access-Control-Max-Age');
    expect(res.statusCode).toEqual(204);
    done();
  });

  test('should send a 405 when access-control-request-method is not allowed', done => {
    const origin = 'fake-origin';
    const req = createMockRequest('OPTIONS', {
      origin,
      'access-control-request-method': 'GET',
    });
    const res = createMockResponse();
    const options: CORSOptions = {
      origin: 'fake-origin',
      methods: ['OPTIONS'],
      withCredentials: false,
      optionsSuccessStatus: 204,
      allowHeaders: '*',
      maxAge: 3600,
    };

    configurePreflightResponse(req, res, options);

    expect(res.statusCode).toBe(405);
    expect(res.setHeader).not.toBeCalledWith('Access-Control-Allow-Methods');
    done();
  });
});
