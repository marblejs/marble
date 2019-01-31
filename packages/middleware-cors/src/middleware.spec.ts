import { HttpMethod, HttpRequest, HttpResponse } from '@marblejs/core';
import { Marbles } from '@marblejs/core/dist/+internal';

import { cors$, CORSOptions } from './middleware';
import { of } from 'rxjs';

export const createMockResponse = () =>
  (({
    writeHead: jest.fn(),
    setHeader: jest.fn(),
    getHeader: jest.fn(),
    end: jest.fn(),
  } as unknown) as HttpResponse);

export const createMockRequest = (
  method: HttpMethod = 'GET',
  headers: any = { origin: 'fake-origin' },
) =>
  (({
    method,
    headers: { ...headers },
  } as unknown) as HttpRequest);

describe('CORS middleware', () => {
  test('pass through non CORS requests', () => {
    const request = createMockRequest('OPTIONS', { origin: null });

    const middleware$ = cors$();

    Marbles.assertEffect(middleware$, [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ]);

  });

  test('handle CORS preflight request', done => {
    expect.assertions(1);

    const request = createMockRequest('OPTIONS', { origin: 'fake-origin' });
    const request$ = of(request);
    const response = createMockResponse();

    const middleware$ = cors$();

    middleware$(request$, response, undefined).subscribe(() => {
      expect(response.setHeader).toBeCalledWith('Access-Control-Allow-Origin', 'fake-origin');
      done();
    });
  });

  test('handle CORS request', done => {
    expect.assertions(3);

    const request = createMockRequest('GET', { origin: 'fake-origin' });
    const request$ = of(request);
    const response = createMockResponse();
    const options: CORSOptions = {
      origin: 'fake-origin',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      withCredentials: true,
      optionsSuccessStatus: 204,
      allowHeaders: '*',
      maxAge: 3600,
      exposeHeaders: ['x-header', 'x-custom-header'],
    };

    const middleware$ = cors$(options);

    middleware$(request$, response, undefined).subscribe(() => {
      expect(response.setHeader).toBeCalledWith('Access-Control-Allow-Origin', 'fake-origin');
      expect(response.setHeader).toBeCalledWith('Access-Control-Allow-Credentials', 'true');
      expect(response.setHeader).toBeCalledWith('Access-Control-Expose-Headers', 'X-Header, X-Custom-Header');
      done();
    });
  });
});
