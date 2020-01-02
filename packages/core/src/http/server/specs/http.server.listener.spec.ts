import * as http from 'http';
import { throwError } from 'rxjs';
import { mapTo, mergeMap } from 'rxjs/operators';
import { r } from '../../router/http.router.ixbuilder';
import { httpListener } from '../http.server.listener';
import { HttpMiddlewareEffect, HttpEffectResponse } from '../../effects/http.effects.interface';
import { createContext, registerAll, bindTo, Context } from '../../../context/context.factory';
import { ServerClientToken } from '../http.server.tokens';

describe('Http listener', () => {
  let responseHandler;
  let context: Context;

  beforeAll(async () => {
    context = await registerAll([
      bindTo(ServerClientToken)(() => http.createServer()),
    ])(createContext());
  });

  beforeEach(() => {
    jest.unmock('../../response/http.responseHandler.ts');
    responseHandler = require('../../response/http.responseHandler.ts');
  });

  test('#httpListener handles received HttpRequest', done => {
    // given
    const req = { url: '/', method: 'GET' } as http.IncomingMessage;
    const res = {} as http.OutgoingMessage;
    const effectResponse = { body: 'test' } as HttpEffectResponse;
    const sender = jest.fn();

    const effect$ = r.pipe(
      r.matchPath('/'),
      r.matchType('GET'),
      r.useEffect(req$ => req$.pipe(mapTo(effectResponse))),
    );

    const middleware$: HttpMiddlewareEffect = req$ => req$;

    // when
    responseHandler.handleResponse = jest.fn(() => () => () => sender);

    httpListener({
      middlewares: [middleware$],
      effects: [effect$],
    })(context)(req, res);

    // then
    expect(sender).toHaveBeenCalledWith(effectResponse);
    done();
  });

  test('#httpListener allows empty middlewares', done => {
    // given
    const req = { url: '/', method: 'GET' } as http.IncomingMessage;
    const res = {} as http.OutgoingMessage;
    const effectResponse = { body: 'test' } as HttpEffectResponse;
    const sender = jest.fn();

    const effect$ = r.pipe(
      r.matchPath('/'),
      r.matchType('GET'),
      r.useEffect(req$ => req$.pipe(mapTo(effectResponse))),
    );

    // when
    responseHandler.handleResponse = jest.fn(() => () => () => sender);

    httpListener({
      middlewares: [],
      effects: [effect$],
    })(context)(req, res);

    // then
    expect(sender).toHaveBeenCalledWith(effectResponse);
    done();
  });

  test('#httpListener catches error', done => {
    // given
    const error = new Error('test');
    const req = { url: '/', method: 'GET' } as http.IncomingMessage;
    const res = {} as http.OutgoingMessage;
    const effectResponse = { body: { error: { message: 'test', status: 500 } }, status: 500 } as HttpEffectResponse;
    const sender = jest.fn();

    const effect$ = r.pipe(
      r.matchPath('/'),
      r.matchType('GET'),
      r.useEffect(req$ => req$.pipe(
        mergeMap(() => throwError(error)),
      )),
    );

    // when
    responseHandler.handleResponse = jest.fn(() => () => () => sender);

    httpListener({
      middlewares: [],
      effects: [effect$],
    })(context)(req, res);

    // then
    expect(sender).toHaveBeenCalledWith(effectResponse);
    done();
  });
});
