import { Observable, merge, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Effect, EffectResponse } from './effects.interface';
import { HttpRequest, HttpResponse } from '../http.interface';

export const combineEffects = (...effects: Effect<EffectResponse>[]) => (
  request$: Observable<HttpRequest>,
  response: HttpResponse
) => {
  const mappedEffects = effects.map(effect => effect(request$, response));
  return merge(...mappedEffects);
};

export const combineMiddlewareEffects = (...effects: Effect<HttpRequest>[]) => (
  request$: Observable<HttpRequest>,
  response: HttpResponse
) => {
  const mappedEffects = effects.map(effect =>
    switchMap((mappedReqest: HttpRequest) => effect(of(mappedReqest), response))
  );
  return request$.pipe(...mappedEffects);
};
