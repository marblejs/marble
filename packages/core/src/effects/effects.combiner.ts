import { concat, from, of } from 'rxjs';
import { concatMap, last, mergeMap } from 'rxjs/operators';
import { HttpRequest } from '../http.interface';
import { matchPath } from '../operators';
import { isGroup, isRouteCombinerConfig } from './effects.helpers';
import { Effect, EffectCombiner, MiddlewareCombiner, RouteCombiner } from './effects.interface';

export const combineEffects: EffectCombiner = effects => {
  return res => req => {
    const req$ = of(req);
    const mappedEffects = effects.map(effect => isGroup(effect)
      ? req$.pipe(
          matchPath(effect.path, { suffix: '/:foo*', combiner: true }),
          mergeMap(combineMiddlewareEffects(effect.middlewares)(res)),
          concatMap(combineEffects(effect.effects)(res))
        )
      : effect(req$, res, undefined)
    );

    return concat(...mappedEffects);
  };
};

export const combineMiddlewareEffects: MiddlewareCombiner = effects => {
  const middlewares = middlewaresGuard(effects);
  return res => req => {
    return from(middlewares).pipe(
      concatMap(effect => effect(of(req), res, undefined)),
      last(),
    );
  };
};

export const combineRoutes: RouteCombiner = (path, configOrEffects) => ({
  path,
  effects: isRouteCombinerConfig(configOrEffects) ? configOrEffects.effects : configOrEffects,
  middlewares: isRouteCombinerConfig(configOrEffects) ? (configOrEffects.middlewares || []) : [],
});

const middlewaresGuard = (middlewares: Effect<HttpRequest>[]) => {
  const emptyMiddleware: Effect<HttpRequest> = req => req;
  return middlewares.length
    ? middlewares
    : [emptyMiddleware];
};
