import { Marbles } from '@marblejs/core/dist/+internal';
import { cors$, CORSOptions } from '../middleware';
import { of } from 'rxjs';
import { createMockRequest, createMockMetadata } from '../util';

describe('CORS middleware', () => {
  test('pass through non CORS requests', () => {
    // given
    const request = createMockRequest('OPTIONS', { origin: null });
    const meta = createMockMetadata();

    // when
    const middleware$ = cors$();

    // then
    Marbles.assertEffect(middleware$, [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { meta });
  });

  test('handle CORS preflight request', done => {
    expect.assertions(1);

    const request = createMockRequest('OPTIONS', { origin: 'fake-origin' });
    const metadata = createMockMetadata();
    const request$ = of(request);

    const middleware$ = cors$();

    middleware$(request$, metadata).subscribe(() => {
      expect(metadata.client.setHeader).toBeCalledWith('Access-Control-Allow-Origin', 'fake-origin');
      done();
    });
  });

  test('handle CORS request', done => {
    expect.assertions(3);

    const request = createMockRequest('GET', { origin: 'fake-origin' });
    const metadata = createMockMetadata();
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

    middleware$(request$, metadata).subscribe(() => {
      expect(metadata.client.setHeader).toBeCalledWith('Access-Control-Allow-Origin', 'fake-origin');
      expect(metadata.client.setHeader).toBeCalledWith('Access-Control-Allow-Credentials', 'true');
      expect(metadata.client.setHeader).toBeCalledWith('Access-Control-Expose-Headers', 'X-Header, X-Custom-Header');
      done();
    });
  });
});
