import { HttpMethod, HttpRequest, HttpResponse } from '@marblejs/core';
import { of } from 'rxjs';

import { cors$ } from './middleware';

describe('CORS middleware', () => {
  const createMockResponse = () =>
    (({
      writeHead: jest.fn(),
      setHeader: jest.fn(),
      getHeader: jest.fn(),
      end: jest.fn(),
    } as unknown) as HttpResponse);

  const createMockRequest = (
    method: HttpMethod = 'GET',
    headers: any = { origin: 'fake-origin' },
  ) =>
    (({
      method,
      headers: { ...headers },
    } as unknown) as HttpRequest);

  describe('Access-Control-Allow-Origin', () => {
    describe('String arg', () => {
      test('should allow wildcard', done => {
        // given
        const allowOrigin = '*';
        const req = createMockRequest();

        const res = createMockResponse();
        const req$ = of(req);

        // when
        const middleware$ = cors$({ origin: allowOrigin })(
          req$,
          res,
          undefined,
        );

        // then
        middleware$.subscribe(
          () => {
            expect(res.setHeader).toBeCalledWith(
              'Access-Control-Allow-Origin',
              allowOrigin,
            );
            done();
          },
          err => {
            fail(err);
            done();
          },
        );
      });

      test('should allow if it matches given allowed string', done => {
        // given
        const origin = 'fake-origin';
        const req = createMockRequest('GET', { origin });

        const res = createMockResponse();
        const req$ = of(req);

        // when
        const middleware$ = cors$({
          origin,
        })(req$, res, undefined);

        // then
        middleware$.subscribe(
          () => {
            expect(res.setHeader).toBeCalledWith(
              'Access-Control-Allow-Origin',
              'fake-origin',
            );
            done();
          },
          err => {
            fail(err);
            done();
          },
        );
      });

      test("should disallow if it doesn't match given allowed string", done => {
        // given
        const origin = 'fake-origin';
        const allowOrigin = 'fake-allowed-origin';
        const mockedRequest = createMockRequest('GET', { origin });

        const res = createMockResponse();
        const req$ = of(mockedRequest);

        // when
        const middleware$ = cors$({
          origin: allowOrigin,
        })(req$, res, undefined);

        // then
        middleware$.subscribe(
          () => {
            expect(res.setHeader).not.toBeCalledWith(
              'Access-Control-Allow-Origin',
              'fake-origin',
            );
            done();
          },
          err => {
            fail(err);
            done();
          },
        );
      });
    });

    describe('Array arg', () => {
      test("should disallow if it doesn't match any allowed origins", done => {
        // given
        const origin = 'fake-origin';
        const allowOrigin = ['fake-allowed-origin', 'other-fake-origin'];
        const req = createMockRequest('GET', { origin });

        const res = createMockResponse();
        const req$ = of(req);

        // when
        const middleware$ = cors$({
          origin: allowOrigin,
        })(req$, res, undefined);

        // then
        middleware$.subscribe(
          () => {
            expect(res.setHeader).not.toBeCalledWith(
              'Access-Control-Allow-Origin',
              'fake-origin',
            );
            done();
          },
          err => {
            fail(err);
            done();
          },
        );
      });

      test('should allow if it matches at least one allowed origins', done => {
        // given
        const origin = 'fake-origin';
        const allowOrigin = [origin, 'other-fake-origin'];
        const mockedRequest = createMockRequest('GET', { origin });

        const res = createMockResponse();
        const req$ = of(mockedRequest);

        // when
        const middleware$ = cors$({
          origin: allowOrigin,
        })(req$, res, undefined);

        // then
        middleware$.subscribe(
          () => {
            expect(res.setHeader).toBeCalledWith(
              'Access-Control-Allow-Origin',
              'fake-origin',
            );
            done();
          },
          err => {
            fail(err);
            done();
          },
        );
      });
    });

    describe('Regexp Arg', () => {
      test('should allow if it matches regexp origin', done => {
        // given
        const origin = 'fake-allowed-origin';
        const allowOrigin = /^(fake-)*/;
        const req = createMockRequest('GET', { origin });

        const res = createMockResponse();
        const req$ = of(req);

        // when
        const middleware$ = cors$({
          origin: allowOrigin,
        })(req$, res, undefined);

        // then
        middleware$.subscribe(
          () => {
            expect(res.setHeader).toBeCalledWith(
              'Access-Control-Allow-Origin',
              'fake-allowed-origin',
            );
            done();
          },
          err => {
            fail(err);
            done();
          },
        );
      });

      test("should disallow if it doesn't match allowed regexp origin", done => {
        // given
        const origin = 'fake-origin';
        const allowOrigin = /^[0-9]/;
        const req = createMockRequest('GET', { origin });

        const res = createMockResponse();
        const req$ = of(req);

        // when
        const middleware$ = cors$({
          origin: allowOrigin,
        })(req$, res, undefined);

        // then
        middleware$.subscribe(
          () => {
            expect(res.setHeader).not.toBeCalledWith(
              'Access-Control-Allow-Origin',
              'fake-origin',
            );
            done();
          },
          err => {
            fail(err);
            done();
          },
        );
      });
    });
  });

  describe('Access-Control-Allow-Methods', () => {
    test('OPTIONS should allow given request methods', done => {
      // given
      const req = createMockRequest('OPTIONS');
      const req$ = of(req);

      const allowMethods = ['GET', 'OPTIONS', 'POST'] as HttpMethod[];
      const res = createMockResponse();

      // when
      const middleware$ = cors$({
        methods: allowMethods,
      })(req$, res, undefined);

      // then
      middleware$.subscribe(
        () => {
          expect(res.setHeader).toBeCalledWith(
            'Access-Control-Allow-Methods',
            'GET, OPTIONS, POST',
          );
          done();
        },
        err => {
          fail(err);
          done();
        },
      );
    });
  });

  describe('Access-Control-Allow-Headers', () => {
    test('OPTIONS should allow wildcard', done => {
      // given
      const req = createMockRequest('OPTIONS');
      const req$ = of(req);

      const allowHeaders = '*';
      const res = createMockResponse();

      // when
      const middleware$ = cors$({
        allowHeaders,
      })(req$, res, undefined);

      // then
      middleware$.subscribe(
        () => {
          expect(res.setHeader).toBeCalledWith(
            'Access-Control-Allow-Headers',
            '*',
          );
          done();
        },
        err => {
          fail(err);
          done();
        },
      );
    });

    test('OPTIONS should allow given allowed headers', done => {
      // given
      const req = createMockRequest('OPTIONS');
      const req$ = of(req);

      const allowHeaders = ['Content-Length', 'X-Header', 'Authorization'];
      const res = createMockResponse();

      // when
      const middleware$ = cors$({
        allowHeaders,
      })(req$, res, undefined);

      // then
      middleware$.subscribe(
        () => {
          expect(res.setHeader).toBeCalledWith(
            'Access-Control-Allow-Headers',
            'Content-Length, X-Header, Authorization',
          );
          done();
        },
        err => {
          fail(err);
          done();
        },
      );
    });
  });

  describe('Access-Control-Allow-Credentials', () => {
    test('should allow credentials', done => {
      // given
      const req = createMockRequest('OPTIONS');
      const req$ = of(req);
      const res = createMockResponse();

      // when
      const middleware$ = cors$({
        withCredentials: true,
      })(req$, res, undefined);

      // then
      middleware$.subscribe(
        () => {
          expect(res.setHeader).toBeCalledWith(
            'Access-Control-Allow-Credentials',
            'true',
          );
          done();
        },
        err => {
          fail(err);
          done();
        },
      );
    });

    test('should disallow credentials', done => {
      // given
      const req = createMockRequest('OPTIONS');
      const req$ = of(req);
      const res = createMockResponse();

      // when
      const middleware$ = cors$({
        withCredentials: false,
      })(req$, res, undefined);

      // then
      middleware$.subscribe(
        () => {
          expect(res.setHeader).not.toBeCalledWith(
            'Access-Control-Allow-Credentials',
            'true',
          );
          done();
        },
        err => {
          fail(err);
          done();
        },
      );
    });
  });
});
