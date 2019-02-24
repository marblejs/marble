import {
  HttpRequest,
  HttpResponse,
  HttpError,
  HttpStatus,
  createContext,
  createEffectMetadata,
  lookup,
} from '@marblejs/core';
import { authorize$ } from '@marblejs/middleware-jwt/src/jwt.middleware';
import { of, throwError, iif } from 'rxjs';
import { flatMap } from 'rxjs/operators';

const verifyPayload$ = (payload: { id: string }) =>
  of(payload).pipe(
    flatMap(payload => iif(
      () => payload.id !== 'test_id',
      throwError(new Error()),
      of(payload)
    )),
  );

describe('JWT middleware', () => {
  let utilModule;
  let factoryModule;
  const context = createContext();
  const effectMeta = createEffectMetadata({ ask: lookup(context) });

  beforeEach(() => {
    jest.unmock('../jwt.util.ts');
    jest.unmock('../jwt.factory.ts');
    utilModule = require('../jwt.util.ts');
    factoryModule = require('../jwt.factory.ts');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('authorize$ authorizes incoming request and saves JWT payload to "req.user"', done => {
    // given
    const mockedSecret = 'test_secret';
    const mockedToken = 'TEST_TOKEN';
    const mockedTokenPayload = { id: 'test_id' };
    const mockedRequest = { headers: { authorization: `Bearer ${mockedToken}`} } as HttpRequest;
    const expectedRequest = { ...mockedRequest, user: mockedTokenPayload };

    const req$ = of(mockedRequest);
    const res = {} as HttpResponse;

    // when
    utilModule.parseAuthorizationHeader = jest.fn(() => mockedToken);
    factoryModule.verifyToken$ = jest.fn(() => () => of(mockedTokenPayload));

    const middleware$ = authorize$({ secret: mockedSecret }, verifyPayload$)(req$, res, effectMeta);

    // then
    middleware$.subscribe(
      req => {
        expect(req).toEqual(expectedRequest);
        expect(utilModule.parseAuthorizationHeader).toHaveBeenCalledTimes(1);
        expect(factoryModule.verifyToken$).toHaveBeenCalledTimes(1);
        done();
      },
      () => {
        fail(`Stream shouldn\'t throw an error`);
        done();
      }
    );
  });

  test('authorize$ throws error if incoming request is not authorized', done => {
    // given
    const mockedSecret = 'test_secret';
    const mockedToken = 'TEST_TOKEN';
    const mockedRequest = { headers: { authorization: `Bearer ${mockedToken}`} } as HttpRequest;
    const expectedError = new HttpError('Unauthorized', HttpStatus.UNAUTHORIZED);

    const req$ = of(mockedRequest);
    const res = {} as HttpResponse;

    // when
    utilModule.parseAuthorizationHeader = jest.fn(() => mockedToken);
    factoryModule.verifyToken$ = jest.fn(() => () => throwError(expectedError));

    const middleware$ = authorize$({ secret: mockedSecret }, verifyPayload$)(req$, res, effectMeta);

    // then
    middleware$.subscribe(
      () => {
        fail(`Stream should throw an error`);
        done();
      },
      err => {
        expect(err).toEqual(expectedError);
        expect(utilModule.parseAuthorizationHeader).toHaveBeenCalledTimes(1);
        expect(factoryModule.verifyToken$).toHaveBeenCalledTimes(1);
        done();
      }
    );
  });

  test('authorize$ throws error if verifyPayload$ handler doesn\'t pass', done => {
    // given
    const mockedSecret = 'test_secret';
    const mockedToken = 'TEST_TOKEN';
    const mockedTokenPayload = { id: 'test_id_wrong' };
    const mockedRequest = { headers: { authorization: `Bearer ${mockedToken}`} } as HttpRequest;
    const expectedError = new HttpError('Unauthorized', HttpStatus.UNAUTHORIZED);

    const req$ = of(mockedRequest);
    const res = {} as HttpResponse;

    // when
    utilModule.parseAuthorizationHeader = jest.fn(() => mockedToken);
    factoryModule.verifyToken$ = jest.fn(() => () => of(mockedTokenPayload));

    const middleware$ = authorize$({ secret: mockedSecret }, verifyPayload$)(req$, res, effectMeta);

    // then
    middleware$.subscribe(
      () => {
        fail(`Stream should throw an error`);
        done();
      },
      err => {
        expect(err).toEqual(expectedError);
        done();
      }
    );
  });
});
