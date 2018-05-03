import { merge, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpRequest } from '../http.interface';
import { EffectCombiner, MiddlewareCombiner } from './effects.interface';

export const combineEffects: EffectCombiner = effects => res => req => {
  const req$ = of(req);
  const mappedEffects = effects.map(effect => effect(req$, res, undefined));
  return merge(...mappedEffects);
};

export const combineMiddlewareEffects: MiddlewareCombiner = effects => res => req => {
  const req$ = of(req);
  const mappedEffects = effects.map(effect =>
    switchMap((mappedReqest: HttpRequest) => effect(of(mappedReqest), res, undefined))
  );
  return req$.pipe(...mappedEffects);
};
