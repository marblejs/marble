import { IncomingMessage, OutgoingMessage } from 'http';
import { of, Subject } from 'rxjs';
import { catchError, defaultIfEmpty, mergeMap, switchMap, tap } from 'rxjs/operators';
import { combineEffects, combineMiddlewareEffects } from './effects/effects.combiner';
import { Effect, EffectResponse, GroupedEffects } from './effects/effects.interface';
import { getErrorMiddleware } from './error/error.middleware';
import { Http, HttpRequest, HttpResponse, HttpStatus } from './http.interface';
import { handleResponse } from './response/response.handler';

type HttpListenerConfig = {
  middlewares?: Effect<HttpRequest>[];
  effects: (Effect | GroupedEffects)[];
  errorMiddleware?: Effect<EffectResponse, Error>;
};

export const httpListener = ({
  middlewares = [],
  effects,
  errorMiddleware,
}: HttpListenerConfig) => {
  const request$ = new Subject<Http>();

  const combinedMiddlewares = combineMiddlewareEffects(middlewares);
  const combinedEffects = combineEffects(effects);
  const providedErrorMiddleware = getErrorMiddleware(errorMiddleware);
  const defaultResponse = { status: HttpStatus.NOT_FOUND } as EffectResponse;

  const effect$ = request$.pipe(
    mergeMap(({ req, res }) =>
      combinedMiddlewares(res)(req).pipe(
        switchMap(combinedEffects(res)),
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
