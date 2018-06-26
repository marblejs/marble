import { HttpMethod } from '../http.interface';
import { Effect, EffectResponse } from './effects.interface';
import { RouteConfig } from '../router/router.interface';

export const effect =
  (path: string) =>
  (method: HttpMethod) =>
  (effect: Effect<EffectResponse>): RouteConfig => ({ path, method, effect });
