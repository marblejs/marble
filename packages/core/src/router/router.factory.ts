import { Effect } from '../effects/effects.interface';
import { HttpRequest } from '../http.interface';
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
import { combineMiddlewareEffects } from '../effects/effects.combiner';

export const factorizeRouting = (
  routes: (RouteEffect | RouteEffectGroup)[],
  middleware: Effect<HttpRequest>[] = [],
  parentPath = '',
): Routing => {
  const routing: Routing = [];

  routes.forEach(route => {
    if (isRouteEffectGroup(route)) {
      return routing.push(...factorizeRouting(
        route.effects,
        [...middleware, ...route.middlewares],
        parentPath + route.path,
      ));
    }

    const { regExp, parameters } = factorizeRegExpWithParams(parentPath + route.path);
    const foundRoute = routing.find(route => route.regExp.source === regExp.source);
    const method: RoutingMethod = {
      effect: route.effect,
      middleware: middleware.length > 0
        ? middleware.length > 1 ? combineMiddlewareEffects(middleware) : middleware[0]
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
      regExp,
      methods: { [route.method]: method },
    } as RoutingItem);
  });

  return routing;
};

export const combineRoutes = (
  path: string,
  configOrEffects: RouteCombinerConfig | (RouteEffect | RouteEffectGroup)[]
): RouteEffectGroup => ({
  path,
  effects: isRouteCombinerConfig(configOrEffects)
    ? configOrEffects.effects
    : configOrEffects,
  middlewares: isRouteCombinerConfig(configOrEffects)
    ? (configOrEffects.middlewares || [])
    : [],
});
