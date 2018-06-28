import { HttpMethod } from '../http.interface';
import { Effect, EffectResponse } from './effects.interface';
import { RouteEffect } from '../router/router.interface';

export namespace EffectFactory {

  export const matchPath = (path: string) => ({
    matchType: (method: HttpMethod) => ({
      use: (effect: Effect<EffectResponse>): RouteEffect => ({
        path, method, effect
      }),
    }),
  });

}
