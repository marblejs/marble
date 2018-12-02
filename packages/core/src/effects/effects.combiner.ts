import { Observable, from } from 'rxjs';
import { concatMap, last, takeWhile } from 'rxjs/operators';
import { HttpRequest, HttpResponse } from '../http.interface';
import { Middleware } from './effects.interface';
export { HttpRequest, HttpResponse, Observable };

export const combineMiddlewares = (middlewares: Middleware[] = []): Middleware => (req$, res, metadata) =>
  middlewares.length
    ? from(middlewares).pipe(
        takeWhile(() => !res.finished),
        concatMap(middleware => middleware(req$, res, metadata)),
        last(),
      )
    : req$;
