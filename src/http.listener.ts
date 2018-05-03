import { Subject } from 'rxjs';
import { defaultIfEmpty, tap, switchMap } from 'rxjs/operators';
import { Http, HttpRequest, HttpResponse } from './http.interface';
import { combineEffects, Effect, combineMiddlewareEffects } from './effects';
import { handleResponse } from './response';
import { StatusCode } from './util';

export const httpListener = (middlewares: Effect<HttpRequest>[], effects: Effect[]) => {
  const request$ = new Subject<Http>();
  const effect$ = request$
    .pipe(
      switchMap(({ req, res }) =>
        combineMiddlewareEffects(middlewares)(res)(req)
          .pipe(
            switchMap(combineEffects(effects)(res)),
            defaultIfEmpty({ status: StatusCode.NOT_FOUND }),
            tap(handleResponse(res))
          )
      )
    );

  effect$.subscribe();

  return (req: HttpRequest, res: HttpResponse) => request$.next({ req, res });
};
