import { Middleware } from '../effects/effects.interface';
import { isRouteEffectGroup, isRouteCombinerConfig } from './router.helpers';
import {
  Routing,
  RoutingMethod,
  RoutingItem,
  RouteEffect,
  RouteEffectGroup,
  RouteCombinerConfig,
} from './router.interface';
import { factorizeRegExpWithParams } from './urlParams.factory';
import { combineMiddlewares } from '../effects/effects.combiner';

export const factorizeRouting = (
  routes: (RouteEffect | RouteEffectGroup)[],
  middleware: Middleware[] = [],
  parentPath = '',
): Routing => {
  const routing: Routing = [];

  routes.forEach(route => {
    const concatenatedPath = parentPath + '/' + route.path;

    if (isRouteEffectGroup(route)) {
      return routing.push(...factorizeRouting(
        route.effects,
        [...middleware, ...route.middlewares],
        concatenatedPath,
      ));
    }

    const { regExp, parameters, path } = factorizeRegExpWithParams(concatenatedPath);
    const foundRoute = routing.find(route => route.regExp.source === regExp.source);
    const method: RoutingMethod = {
      effect: route.effect,
      middleware: middleware.length > 0
        ? middleware.length > 1 ? combineMiddlewares(middleware) : middleware[0]
        : undefined,
      parameters,
    };

    if (foundRoute) {
      if (foundRoute.methods[route.method]) {
        throw new Error(`Redefinition of route at "${route.method}: ${parentPath + route.path}"`);
      }

      return foundRoute.methods[route.method] = method;
    }

    return routing.push({
      path,
      regExp,
      methods: { [route.method]: method },
    } as RoutingItem);
  });

  return routing;
};

export function combineRoutes(path: string, config: RouteCombinerConfig): RouteEffectGroup;
export function combineRoutes(path: string, effects: (RouteEffect | RouteEffectGroup)[]): RouteEffectGroup;
export function combineRoutes(
  path: string,
  configOrEffects: RouteCombinerConfig | (RouteEffect | RouteEffectGroup)[]
): RouteEffectGroup {
  return {
    path,
    effects: isRouteCombinerConfig(configOrEffects)
      ? configOrEffects.effects
      : configOrEffects,
    middlewares: isRouteCombinerConfig(configOrEffects)
      ? (configOrEffects.middlewares || [])
      : [],
  };
}
