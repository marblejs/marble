import { HttpRequest, HttpResponse } from '@marblejs/core';
import { of } from 'rxjs';

import { cors$ } from './middleware';
import { OutgoingMessage } from 'http';

describe('CORS middleware', () => {
  describe('Access-Control-Allow-Origin', () => {
    test('cors$ allow if it matches given allowed string', done => {
      // given
      const allowOrigin = 'fake-origin';
      const mockedRequest = ({
        headers: { origin: allowOrigin },
      } as unknown) as HttpRequest;

      const res = (new OutgoingMessage() as unknown) as HttpResponse;
      const spy = jest.spyOn(res, 'setHeader');
      const req$ = of(mockedRequest);

      // when
      const middleware$ = cors$({ origin: allowOrigin })(req$, res, undefined);

      // then
      middleware$.subscribe(
        () => {
          expect(spy).toBeCalledWith(
            'Access-Control-Allow-Origin',
            allowOrigin,
          );
          expect(res.getHeader('Access-Control-Allow-Origin')).toEqual(
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

    test("cors$ disallow if it doesn't match given allowed string", done => {
      // given
      const reqOrigin = 'fake-origin';
      const allowOrigin = 'fake-allowed-origin';
      const mockedRequest = ({
        headers: { origin: reqOrigin },
      } as unknown) as HttpRequest;

      const res = (new OutgoingMessage() as unknown) as HttpResponse;
      const spy = jest.spyOn(res, 'setHeader');
      const req$ = of(mockedRequest);

      // when
      const middleware$ = cors$({ origin: allowOrigin })(req$, res, undefined);

      // then
      middleware$.subscribe(
        () => {
          expect(spy).not.toBeCalled();
          expect(res.hasHeader('Access-Control-Allow-Origin')).toBeFalsy();
          done();
        },
        err => {
          fail(err);
          done();
        },
      );
    });

    test('cors$ allow if it matches at least one allowed origins', done => {
      // given
      const reqOrigin = 'fake-allowed-origin';
      const allowOrigin = ['fake-allowed-origin', 'other-fake-origin'];
      const mockedRequest = ({
        headers: { origin: reqOrigin },
      } as unknown) as HttpRequest;

      const res = (new OutgoingMessage() as unknown) as HttpResponse;
      const spy = jest.spyOn(res, 'setHeader');
      const req$ = of(mockedRequest);

      // when
      const middleware$ = cors$({ origin: allowOrigin })(req$, res, undefined);

      // then
      middleware$.subscribe(
        () => {
          expect(spy).toBeCalledWith('Access-Control-Allow-Origin', reqOrigin);
          expect(res.getHeader('Access-Control-Allow-Origin')).toBe(reqOrigin);
          done();
        },
        err => {
          fail(err);
          done();
        },
      );
    });

    test("cors$ disallow if it doesn't match any allowed origins", done => {
      // given
      const reqOrigin = 'fake-origin';
      const allowOrigin = ['fake-allowed-origin', 'other-fake-origin'];
      const mockedRequest = ({
        headers: { origin: reqOrigin },
      } as unknown) as HttpRequest;

      const res = (new OutgoingMessage() as unknown) as HttpResponse;
      const spy = jest.spyOn(res, 'setHeader');
      const req$ = of(mockedRequest);

      // when
      const middleware$ = cors$({ origin: allowOrigin })(req$, res, undefined);

      // then
      middleware$.subscribe(
        () => {
          expect(spy).not.toBeCalled();
          expect(res.hasHeader('Access-Control-Allow-Origin')).toBeFalsy();
          done();
        },
        err => {
          fail(err);
          done();
        },
      );
    });

    test('cors$ allow if it matches regexp origin', done => {
      // given
      const reqOrigin = 'fake-allowed-origin';
      const allowOrigin = /^(fake-)*/;
      const mockedRequest = ({
        headers: { origin: reqOrigin },
      } as unknown) as HttpRequest;

      const res = (new OutgoingMessage() as unknown) as HttpResponse;
      const spy = jest.spyOn(res, 'setHeader');
      const req$ = of(mockedRequest);

      // when
      const middleware$ = cors$({ origin: allowOrigin })(req$, res, undefined);

      // then
      middleware$.subscribe(
        () => {
          expect(spy).toBeCalledWith('Access-Control-Allow-Origin', reqOrigin);
          expect(res.getHeader('Access-Control-Allow-Origin')).toBe(reqOrigin);
          done();
        },
        err => {
          fail(err);
          done();
        },
      );
    });

    test("cors$ disallow if it doesn't match allowed regexp origin", done => {
      // given
      const reqOrigin = 'fake-origin';
      const allowOrigin = /^(allowed-origin)/;
      const mockedRequest = ({
        headers: { origin: reqOrigin },
      } as unknown) as HttpRequest;

      const res = (new OutgoingMessage() as unknown) as HttpResponse;
      const spy = jest.spyOn(res, 'setHeader');
      const req$ = of(mockedRequest);

      // when
      const middleware$ = cors$({ origin: allowOrigin })(req$, res, undefined);

      // then
      middleware$.subscribe(
        () => {
          expect(spy).not.toBeCalled();
          expect(res.hasHeader('Access-Control-Allow-Origin')).toBeFalsy();
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
