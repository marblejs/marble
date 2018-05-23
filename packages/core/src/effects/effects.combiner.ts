import { merge, of } from 'rxjs';
import { mergeMap, switchMap } from 'rxjs/operators';
import { HttpRequest } from '../http.interface';
import { matchPath } from '../operators';
import { isGroup } from './effects.helpers';
import { EffectCombiner, MiddlewareCombiner, RouteCombiner } from './effects.interface';

export const combineEffects: EffectCombiner = effects => res => req => {
  const req$ = of(req);
  const mappedEffects = effects.map(effect => isGroup(effect)
    ? req$.pipe(
        matchPath(effect.path, { suffix: '/:foo*', combiner: true }),
        mergeMap(combineEffects(effect.effects)(res))
      )
    : effect(req$, res, undefined)
  );

  return merge(...mappedEffects);
};

export const combineMiddlewareEffects: MiddlewareCombiner = effects => res => req => {
  const req$ = of(req);
  const mappedEffects = effects.map(effect =>
    switchMap((mappedReqest: HttpRequest) => effect(of(mappedReqest), res, undefined))
  );
  return req$.pipe(...mappedEffects);
};

export const combineRoutes: RouteCombiner = (path, effects) =>
  ({ path, effects });
