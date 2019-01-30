import {
  configureAllowedOrigin,
  configureAllowedHeaders,
  configureAllowedMethods,
  applyHeaders,
  configureCredentials,
  configureHeaders,
} from './configureHeaders';
import { createMockResponse, createMockRequest } from './middleware.spec';
import { CORSOptions } from './middleware';

const origin = 'fake-origin';

describe('configureAllowedOrigin', () => {
  test('return an empty array if no match', done => {
    const configured = configureAllowedOrigin(origin, []);
    expect(configured).toHaveLength(0);
    done();
  });

  test('handle wildcard correctly', done => {
    const configured = configureAllowedOrigin(origin, '*');
    expect(configured).toHaveLength(1);
    expect(configured[0].key).toEqual('Access-Control-Allow-Origin');
    expect(configured[0].value).toEqual('*');
    done();
  });

  test('handle wildcard correctly', done => {
    const configured = configureAllowedOrigin(origin, 'fake-origin');
    expect(configured).toHaveLength(1);
    expect(configured[0].key).toEqual('Access-Control-Allow-Origin');
    expect(configured[0].value).toEqual('fake-origin');
    done();
  });

  test('handle array correctly', done => {
    const configured = configureAllowedOrigin(origin, ['fake-origin']);
    expect(configured).toHaveLength(1);
    expect(configured[0].key).toEqual('Access-Control-Allow-Origin');
    expect(configured[0].value).toEqual('fake-origin');
    done();
  });

  test('handle regexp correctly', done => {
    const configured = configureAllowedOrigin(origin, /[aZ-]/);
    expect(configured).toHaveLength(1);
    expect(configured[0].key).toEqual('Access-Control-Allow-Origin');
    expect(configured[0].value).toEqual('fake-origin');
    done();
  });
});

describe('configureAllowedHeaders', () => {
  test('handle wildcard correctly', done => {
    const configured = configureAllowedHeaders('*');
    expect(configured).toHaveLength(1);
    expect(configured[0].key).toEqual('Access-Control-Allow-Headers');
    expect(configured[0].value).toEqual('*');
    done();
  });

  test('handle many headers correctly', done => {
    const configured = configureAllowedHeaders([
      'x-custom-tag',
      'x-custom-timestamp',
    ]);
    expect(configured).toHaveLength(1);
    expect(configured[0].key).toEqual('Access-Control-Allow-Headers');
    expect(configured[0].value).toEqual('X-Custom-Tag, X-Custom-Timestamp');
    done();
  });
});

describe('configureAllowedMethods', () => {
  test('handle many methods correctly', done => {
    const configured = configureAllowedMethods('POST', ['POST', 'GET']);
    expect(configured).toHaveLength(1);
    expect(configured[0].key).toEqual('Access-Control-Allow-Methods');
    expect(configured[0].value).toEqual('POST, GET');
    done();
  });
});

describe('configureCredentials', () => {
  test('handle credentials correctly', done => {
    const configured = configureCredentials(true);
    expect(configured).toHaveLength(1);
    expect(configured[0].key).toEqual('Access-Control-Allow-Credentials');
    expect(configured[0].value).toEqual('true');
    done();
  });
});

describe('applyHeaders', () => {
  test('handle many methods correctly', done => {
    const configured = [{ key: 'Foo', value: 'Bar' }];
    const res = createMockResponse();

    applyHeaders(configured, res);

    expect(res.setHeader).toBeCalledWith('Foo', 'Bar');
    done();
  });
});

describe('configureHeaders', () => {
  test('should configure headers correctly', done => {
    const res = createMockResponse();
    const req = createMockRequest('OPTIONS');
    const options: CORSOptions = {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      withCredentials: false,
      optionsSuccessStatus: 204,
      allowHeaders: '*',
    };

    configureHeaders(req.headers.origin as string, req.method, res, options);

    expect(res.setHeader).toBeCalledTimes(4);
    expect(res.statusCode).toEqual(options.optionsSuccessStatus);
    done();
  });
});
