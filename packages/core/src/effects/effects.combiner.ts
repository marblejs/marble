import { from } from 'rxjs';
import { concatMap, last } from 'rxjs/operators';
import { HttpRequest, HttpResponse } from '../http.interface';
import { Middleware, MiddlewareCombiner } from './effects.interface';
import { Observable } from 'rxjs/Observable';

export const combineMiddlewareEffects: MiddlewareCombiner = (effects: Middleware[]): Middleware => {
  const middlewaresObservable = from(middlewaresGuard(effects));

  return (req$: Observable<HttpRequest>, res: HttpResponse, metadata: any) => {
    return middlewaresObservable.pipe(
      concatMap(effect => effect(req$, res, metadata)),
      last(),
    );
  };
};

const middlewaresGuard = (middlewares: Middleware[]) => {
  const emptyMiddleware: Middleware = req => req;
  return middlewares.length
    ? middlewares
    : [emptyMiddleware];
};
