import { of } from 'rxjs';
import { Marbles } from '@marblejs/core/dist/+internal/testing';
import { createHttpRequest } from '@marblejs/http/dist/+internal/testing.util';
import { cors$, CORSOptions } from '../middleware';
import { createMockRequest, createMockEffectContext } from '../util';

describe('CORS middleware', () => {
  afterEach(jest.clearAllMocks);

  test('pass through non CORS requests', () => {
    // given
    const request = createMockRequest('OPTIONS', { origin: null });
    const ctx = createMockEffectContext();

    // when
    const middleware$ = cors$();

    // then
    Marbles.assertEffect(middleware$, [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { ctx });
  });

  test('handle CORS preflight request', done => {

    const request = createHttpRequest({ method: 'OPTIONS', headers: { origin: 'fake-origin' } });
    const ctx = createMockEffectContext();
    const request$ = of(request);

    const middleware$ = cors$();

    middleware$(request$, ctx).subscribe({
      next: () => fail('Should not return any further value.'),
      complete: () => {
        expect(request.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'fake-origin');
        expect(request.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'HEAD, GET, POST, PUT, PATCH, DELETE, OPTIONS');
        done();
      },
    });
  });

  test('handle CORS request', done => {
    expect.assertions(3);

    const request = createMockRequest('GET', { origin: 'fake-origin' });
    const ctx = createMockEffectContext();
    const request$ = of(request);
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

    middleware$(request$, ctx).subscribe(() => {
      expect(request.response.setHeader).toBeCalledWith('Access-Control-Allow-Origin', 'fake-origin');
      expect(request.response.setHeader).toBeCalledWith('Access-Control-Allow-Credentials', 'true');
      expect(request.response.setHeader).toBeCalledWith('Access-Control-Expose-Headers', 'X-Header, X-Custom-Header');
      done();
    });
  });
});
