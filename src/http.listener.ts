import * as http from 'http';
import { Subject, of } from 'rxjs';
import { defaultIfEmpty, map, tap, switchMap } from 'rxjs/operators';
import { Http, HttpRequest, HttpResponse } from './http.interface';
import { combineEffects, Effect, EffectResponse, combineMiddlewareEffects } from './effects';
import { loggerMiddleware } from './middlewares';
import { handleResponse } from './response';
import { StatusCode } from './util';

const middlewares = [
  loggerMiddleware,
];

export const httpListener = (...effects: Effect[]) => {
  const request$ = new Subject<Http>();
  const effect$ = request$
    .pipe(
      switchMap(({ req, res }) =>
        combineMiddlewareEffects(...middlewares)(of(req), res)
          .pipe(
            switchMap(req =>
              combineEffects(...effects)(of(req), res)
                .pipe(
                  defaultIfEmpty({ status: StatusCode.NOT_FOUND }),
                  tap(effect => handleResponse(res)(effect))
                )
            ),
          )
        )
    );

  effect$.subscribe();

  return (req: HttpRequest, res: HttpResponse) => request$.next({ req, res });
};
