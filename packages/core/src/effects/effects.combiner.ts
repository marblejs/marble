import { from, of } from 'rxjs';
import { concatMap, last } from 'rxjs/operators';
import { HttpRequest } from '../http.interface';
import { Effect, MiddlewareCombiner } from './effects.interface';

export const combineMiddlewareEffects: MiddlewareCombiner = effects => {
  const middlewares = middlewaresGuard(effects);
  return res => req => {
    return from(middlewares).pipe(
      concatMap(effect => effect(of(req), res, undefined)),
      last(),
    );
  };
};

const middlewaresGuard = (middlewares: Effect<HttpRequest>[]) => {
  const emptyMiddleware: Effect<HttpRequest> = req => req;
  return middlewares.length
    ? middlewares
    : [emptyMiddleware];
};
