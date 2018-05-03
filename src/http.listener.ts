import { Subject, of } from 'rxjs';
import { catchError, defaultIfEmpty, switchMap, tap } from 'rxjs/operators';
import { Effect, combineEffects, combineMiddlewareEffects } from './effects';
import { Http, HttpRequest, HttpResponse } from './http.interface';
import { errorCatcher$ } from './middlewares/errorCatcher.middleware';
import { handleResponse } from './response';
import { StatusCode } from './util';

type HttpListenerConfig = {
  middlewares: Effect<HttpRequest>[],
  effects: Effect[],
};

export const httpListener = ({ middlewares, effects }: HttpListenerConfig) => {
  const request$ = new Subject<Http>();
  const effect$ = request$
    .pipe(
      switchMap(({ req, res }) =>
        combineMiddlewareEffects(middlewares)(res)(req)
          .pipe(
            switchMap(combineEffects(effects)(res)),
            defaultIfEmpty({ status: StatusCode.NOT_FOUND }),
            tap(handleResponse(res)),
            catchError(error => errorCatcher$(of(req), res, error))
          )
      )
    );

  effect$.subscribe();

  return (req: HttpRequest, res: HttpResponse) => request$.next({ req, res });
};
