import * as http from 'http';
import { Subject, of } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { Http, HttpRequest, HttpResponse } from './http.interface';
import { combineEffects, RequestEffect, EffectResponse } from './effects';
import { loggerMiddleware } from './middlewares';
import { handleResponse } from './response';

export const httpListener = (...effects: RequestEffect[]) => {
  const request$ = new Subject<Http>();

  request$
    .pipe(
      map(loggerMiddleware),
      switchMap(http => combineEffects(...effects)(of(http.req))
        .pipe(
          tap(effect => handleResponse(http.res)(effect))
        )
      ),
    )
    .subscribe();


  return (req: HttpRequest, res: HttpResponse) => request$.next({ req, res });
};
