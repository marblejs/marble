import { Subject, of } from 'rxjs';
import { catchError, defaultIfEmpty, switchMap, tap } from 'rxjs/operators';
import { Effect, EffectResponse, combineEffects, combineMiddlewareEffects } from './effects';
import { Http, HttpRequest, HttpResponse } from './http.interface';
import { getErrorMiddleware } from './middlewares';
import { handleResponse } from './response';
import { StatusCode } from './util';

type HttpListenerConfig = {
  middlewares: Effect<HttpRequest>[],
  effects: Effect[],
  errorMiddleware?: Effect<EffectResponse, Error>,
};

export const httpListener = ({ middlewares, effects, errorMiddleware }: HttpListenerConfig) => {
  const request$ = new Subject<Http>();
  const effect$ = request$
    .pipe(
      switchMap(({ req, res }) =>
        combineMiddlewareEffects(middlewares)(res)(req)
          .pipe(
            switchMap(combineEffects(effects)(res)),
            defaultIfEmpty({ status: StatusCode.NOT_FOUND }),
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
