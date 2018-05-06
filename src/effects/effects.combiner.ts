import { merge, of } from 'rxjs';
import { mergeMap, switchMap } from 'rxjs/operators';
import { HttpRequest } from '../http.interface';
import { matchPath } from '../operators/matchPath.operator';
import { EffectCombiner, MiddlewareCombiner, RoutesCombiner, isGroup } from './effects.interface';

export const combineEffects: EffectCombiner = effects => res => req => {
  const req$ = of(req);
  const mappedEffects = effects.map(effect => isGroup(effect)
    ? req$.pipe(
        matchPath(effect.path, '/:foo*'),
        mergeMap(combineEffects(effect.effects)(res))
      )
    : effect(req$, res, undefined)
  );

  return merge(...mappedEffects);
};

export const combineRoutes: RoutesCombiner = (path, effects) => ({
  path,
  effects
});

export const combineMiddlewareEffects: MiddlewareCombiner = effects => res => req => {
  const req$ = of(req);
  const mappedEffects = effects.map(effect =>
    switchMap((mappedReqest: HttpRequest) => effect(of(mappedReqest), res, undefined))
  );
  return req$.pipe(...mappedEffects);
};
