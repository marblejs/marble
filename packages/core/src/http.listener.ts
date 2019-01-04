import { IncomingMessage, OutgoingMessage } from 'http';
import { of, Subject } from 'rxjs';
import { catchError, defaultIfEmpty, mergeMap, switchMap, tap, takeWhile } from 'rxjs/operators';
import { combineMiddlewares } from './effects/effects.combiner';
import { EffectHttpResponse, Middleware, ErrorEffect } from './effects/effects.interface';
import { Http, HttpRequest, HttpResponse, HttpStatus } from './http.interface';
import { handleResponse } from './response/response.handler';
import { RouteEffect, RouteEffectGroup } from './router/router.interface';
import { resolveRouting } from './router/router.resolver';
import { factorizeRouting } from './router/router.factory';
import { defaultError$ } from './error/error.effect';
import { createStaticInjectionContainer } from './server/server.injector';

export interface HttpListenerConfig {
  middlewares?: Middleware[];
  effects: (RouteEffect | RouteEffectGroup)[];
  errorEffect?: ErrorEffect;
}

export const httpListener = ({
  middlewares = [],
  effects,
  errorEffect = defaultError$,
}: HttpListenerConfig) => {
  const requestSubject$ = new Subject<Http>();
  const combinedMiddlewares = combineMiddlewares(...middlewares);
  const routing = factorizeRouting(effects);
  const injector = createStaticInjectionContainer();
  const defaultResponse = { status: HttpStatus.NOT_FOUND } as EffectHttpResponse;

  const effect$ = requestSubject$.pipe(
    mergeMap(({ req, res }) => {
      res.send = handleResponse(res)(req);

      return combinedMiddlewares(of(req), res, injector.get).pipe(
        takeWhile(() => !res.finished),
        switchMap(resolveRouting(routing, injector.get)(res)),
        defaultIfEmpty(defaultResponse),
        tap(res.send),
        catchError(error =>
          errorEffect(of(req), res, error).pipe(
            tap(res.send),
          ),
        ),
      );
    }),
  );

  effect$.subscribe();

  const httpServer = (req: IncomingMessage, res: OutgoingMessage) => requestSubject$.next({
    req: req as HttpRequest,
    res: res as HttpResponse,
  });

  httpServer.config = {
    routing,
    injector,
  };

  return httpServer;
};
