import { merge, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EffectCombiner, MiddlewareCombiner } from './effects.interface';
import { HttpRequest } from '../http.interface';

export const combineEffects: EffectCombiner = effects => res => req => {
  const req$ = of(req);
  const mappedEffects = effects.map(effect => effect(req$, res));
  return merge(...mappedEffects);
};

export const combineMiddlewareEffects: MiddlewareCombiner = effects => res => req => {
  const req$ = of(req);
  const mappedEffects = effects.map(effect =>
    switchMap((mappedReqest: HttpRequest) => effect(of(mappedReqest), res))
  );
  return req$.pipe(...mappedEffects);
};
