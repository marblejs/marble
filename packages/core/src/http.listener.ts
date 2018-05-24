import { Subject, of } from 'rxjs';
import { catchError, defaultIfEmpty, switchMap, mergeMap, tap } from 'rxjs/operators';
import { combineEffects, combineMiddlewareEffects } from './effects/effects.combiner';
import { Effect, EffectResponse, GroupedEffects } from './effects/effects.interface';
import { Http, HttpRequest, HttpResponse, HttpStatus } from './http.interface';
import { getErrorMiddleware } from './middlewares/error.middleware';
import { handleResponse } from './response/response.handler';

type HttpListenerConfig = {
  middlewares?: Effect<HttpRequest>[],
  effects: (Effect | GroupedEffects)[],
  errorMiddleware?: Effect<EffectResponse, Error>,
};

export const httpListener = ({ middlewares = [], effects, errorMiddleware }: HttpListenerConfig) => {
  const request$ = new Subject<Http>();
  const effect$ = request$
    .pipe(
      mergeMap(({ req, res }) =>
        combineMiddlewareEffects(middlewares)(res)(req)
          .pipe(
            switchMap(combineEffects(effects)(res)),
            defaultIfEmpty({ status: HttpStatus.NOT_FOUND } as EffectResponse),
            tap(handleResponse(res)),
            catchError(error =>
              getErrorMiddleware(errorMiddleware)(of(req), res, error)
                .pipe(
                  tap(handleResponse(res)),
                ),
            )
          )
      )
    );

  effect$.subscribe();

  return (req: HttpRequest, res: HttpResponse) => request$.next({ req, res });
};
