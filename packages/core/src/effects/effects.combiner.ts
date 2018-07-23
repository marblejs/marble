import { Observable, from } from 'rxjs';
import { concatMap, last, takeWhile } from 'rxjs/operators';
import { HttpRequest, HttpResponse } from '../http.interface';
import { Middleware } from './effects.interface';
export { HttpRequest, HttpResponse, Observable };

export const combineMiddlewareEffects = (effects: Middleware[]): Middleware => {
  const middlewaresObservable = from(middlewaresGuard(effects));

  return (req$, res, metadata) => {
    return middlewaresObservable.pipe(
      takeWhile(() => !res.finished),
      concatMap(effect => effect(req$, res, metadata)),
      last(),
    );
  };
};

const middlewaresGuard = (middlewares: Middleware[]) => {
  const emptyMiddleware: Middleware = req$ => req$;
  return middlewares.length
    ? middlewares
    : [emptyMiddleware];
};
