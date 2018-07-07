import { IncomingMessage, OutgoingMessage } from 'http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, defaultIfEmpty, mergeMap, switchMap, tap } from 'rxjs/operators';
import { combineMiddlewareEffects } from './effects/effects.combiner';
import { EffectResponse, Middleware, ErrorMiddleware } from './effects/effects.interface';
import { getErrorMiddleware } from './error/error.middleware';
import { Http, HttpRequest, HttpResponse, HttpStatus } from './http.interface';
import { handleResponse } from './response/response.handler';
import { RouteEffect, RouteEffectGroup } from './router/router.interface';
import { resolveRouting } from './router/router';
import { factorizeRouting } from './router/router.factory';
export { Observable };

type HttpListenerConfig = {
  middlewares?: Middleware[];
  effects: (RouteEffect | RouteEffectGroup)[];
  errorMiddleware?: ErrorMiddleware;
};

export const httpListener = ({
  middlewares = [],
  effects,
  errorMiddleware,
}: HttpListenerConfig) => {
  const request$ = new Subject<Http>();

  const combinedMiddlewares = combineMiddlewareEffects(middlewares);
  const routerEffects = factorizeRouting(effects);
  const providedErrorMiddleware = getErrorMiddleware(errorMiddleware);
  const defaultResponse = { status: HttpStatus.NOT_FOUND } as EffectResponse;

  const effect$ = request$.pipe(
    mergeMap(({ req, res }) =>
      combinedMiddlewares(of(req), res, undefined).pipe(
        switchMap(resolveRouting(routerEffects)(res)),
        defaultIfEmpty(defaultResponse),
        tap(handleResponse(res)(req)),
        catchError(error =>
          providedErrorMiddleware(of(req), res, error).pipe(
            tap(handleResponse(res)(req)),
          ),
        ),
      ),
    ),
  );

  effect$.subscribe();

  return (req: IncomingMessage, res: OutgoingMessage) => request$.next({
    req: req as HttpRequest,
    res: res as HttpResponse,
  });
};
