import { from } from 'rxjs';
import { concatMap, last } from 'rxjs/operators';
import { Middleware } from './effects.interface';

export const combineMiddlewareEffects = (effects: Middleware[]): Middleware => {
  const middlewaresObservable = from(middlewaresGuard(effects));

  return (req$, res, metadata) => {
    return middlewaresObservable.pipe(
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
