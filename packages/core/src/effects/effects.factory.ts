import { HttpMethod } from '../http.interface';
import { Effect, EffectResponse } from './effects.interface';
import { RouteConfig } from '../router/router.interface';

export namespace EffectFactory {

  export const matchPath = (path: string) => ({
    matchType: (method: HttpMethod) => ({
      use: (effect: Effect<EffectResponse>): RouteConfig => ({
        path, method, effect
      }),
    }),
  });

}
