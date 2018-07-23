import { IncomingMessage, OutgoingMessage } from 'http';
import { of, throwError } from 'rxjs';
import { mapTo, switchMap } from 'rxjs/operators';
import { httpListener } from './http.listener';
import { EffectFactory } from './effects/effects.factory';
import { Middleware, ErrorMiddleware } from './effects/effects.interface';

describe('Http listener', () => {
  let errorMiddleware;
  let effectsCombiner;
  let responseHandler;
  let routerFactory;
  let router;

  const effect$ = EffectFactory
    .matchPath('/')
    .matchType('GET')
    .use(req$ => req$.pipe(mapTo( {} )));

  const middleware$: Middleware = req$ => req$;
  const errorMiddleware$: ErrorMiddleware = req$ => req$.pipe(mapTo( {} ));

  beforeEach(() => {
    jest.unmock('./error/error.middleware.ts');
    jest.unmock('./effects/effects.combiner.ts');
    jest.unmock('./response/response.handler.ts');
    jest.unmock('./router/router.factory.ts');
    jest.unmock('./router/router.ts');

    errorMiddleware = require('./error/error.middleware.ts');
    effectsCombiner = require('./effects/effects.combiner.ts');
    responseHandler = require('./response/response.handler.ts');
    routerFactory = require('./router/router.factory.ts');
    router = require('./router/router.ts');
  });

  test('#httpListener handles received HttpRequest', done => {
    // given
    const req = {} as IncomingMessage;
    const res = {} as OutgoingMessage;

    // when
    effectsCombiner.combineMiddlewareEffects = jest.fn(() => () => of(req));
    routerFactory.factorizeRouting = jest.fn(() => []);
    router.resolveRouting = jest.fn(() => () => () => of({ body: 'test' }));
    responseHandler.handleResponse = jest.fn(() => () => () => undefined);
    errorMiddleware.getErrorMiddleware = jest.fn(() => errorMiddleware$);

    httpListener({
      middlewares: [middleware$],
      effects: [effect$],
    })(req, res);

    // then
    setTimeout(() => {
      expect(effectsCombiner.combineMiddlewareEffects).toHaveBeenCalledWith([middleware$]);
      expect(routerFactory.factorizeRouting).toHaveBeenCalledWith([effect$]);
      expect(router.resolveRouting).toHaveBeenCalled();
      expect(responseHandler.handleResponse).toHaveBeenCalled();
      done();
    });
  });

  test('#httpListener allows empty middlewares', () => {
    // given
    const req = {} as IncomingMessage;

    // when
    effectsCombiner.combineMiddlewareEffects = jest.fn(() => () => of(req));
    routerFactory.factorizeRouting = jest.fn(() => []);
    errorMiddleware.getErrorMiddleware = jest.fn(() => errorMiddleware$);

    httpListener({
      effects: [effect$],
    });

    // then
    expect(effectsCombiner.combineMiddlewareEffects).toHaveBeenCalledWith([]);
  });

  test('#httpListener catches error', done => {
    // given
    const error = new Error('test');
    const req = {} as IncomingMessage;
    const res = {} as OutgoingMessage;
    const errorHandler = jest.fn(() => of({ body: 'error' }));

    // when
    effectsCombiner.combineMiddlewareEffects = jest.fn(() => () => of(req));
    routerFactory.factorizeRouting = jest.fn(() => []);
    router.resolveRouting = jest.fn(() => () => () => of({ body: 'test' }).pipe(switchMap(() => throwError(error))));
    responseHandler.handleResponse = jest.fn(() => () => () => undefined);
    errorMiddleware.getErrorMiddleware = jest.fn(() => errorHandler);

    httpListener({
      middlewares: [middleware$],
      effects: [effect$],
    })(req, res);

    // then
    setTimeout(() => {
      expect(responseHandler.handleResponse).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalled();
      done();
    });
  });

});
