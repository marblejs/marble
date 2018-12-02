import { IncomingMessage, OutgoingMessage } from 'http';
import { of, Subject } from 'rxjs';
import { catchError, defaultIfEmpty, mergeMap, switchMap, tap, takeWhile } from 'rxjs/operators';
import { combineMiddlewares } from './effects/effects.combiner';
import { EffectResponse, Middleware, ErrorEffect } from './effects/effects.interface';
import { errorEffectProvider } from './error/error.effect';
import { Http, HttpRequest, HttpResponse, HttpStatus } from './http.interface';
import { handleResponse } from './response/response.handler';
import { RouteEffect, RouteEffectGroup } from './router/router.interface';
import { resolveRouting } from './router/router';
import { factorizeRouting } from './router/router.factory';

type HttpListenerConfig = {
  middlewares?: Middleware[];
  effects: (RouteEffect | RouteEffectGroup)[];
  errorEffect?: ErrorEffect;
};

export const httpListener = ({
  middlewares = [],
  effects,
  errorEffect,
}: HttpListenerConfig) => {
  const request$ = new Subject<Http>();

  const combinedMiddlewares = combineMiddlewares(middlewares);
  const routerEffects = factorizeRouting(effects);
  const providedErrorEffect = errorEffectProvider(errorEffect);
  const defaultResponse = { status: HttpStatus.NOT_FOUND } as EffectResponse;

  const effect$ = request$.pipe(
    mergeMap(({ req, res }) => {
      res.send = handleResponse(res)(req);

      return combinedMiddlewares(of(req), res, undefined).pipe(
        takeWhile(() => !res.finished),
        switchMap(resolveRouting(routerEffects)(res)),
        defaultIfEmpty(defaultResponse),
        tap(res.send),
        catchError(error =>
          providedErrorEffect(of(req), res, error).pipe(
            tap(res.send),
          ),
        ),
      );
    }),
  );

  effect$.subscribe();

  return (req: IncomingMessage, res: OutgoingMessage) => request$.next({
    req: req as HttpRequest,
    res: res as HttpResponse,
  });
};
