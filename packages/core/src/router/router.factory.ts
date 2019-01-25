import { HttpMiddleware } from '../effects/effects.interface';
import { combineMiddlewares } from '../effects/effects.combiner';
import { isRouteEffectGroup } from './router.helpers';
import {
  Routing,
  RoutingMethod,
  RoutingItem,
  RouteEffect,
  RouteEffectGroup,
} from './router.interface';
import { factorizeRegExpWithParams } from './router.params.factory';

export const factorizeRouting = (
  routes: (RouteEffect | RouteEffectGroup)[],
  middlewares: HttpMiddleware[] = [],
  parentPath = '',
): Routing => {
  const routing: Routing = [];

  routes.forEach(route => {
    const concatenatedPath = parentPath + '/' + route.path;

    if (isRouteEffectGroup(route)) {
      return routing.push(...factorizeRouting(
        route.effects,
        [...middlewares, ...route.middlewares],
        concatenatedPath,
      ));
    }

    const { regExp, parameters, path } = factorizeRegExpWithParams(concatenatedPath);
    const foundRoute = routing.find(route => route.regExp.source === regExp.source);
    const method: RoutingMethod = {
      effect: route.effect,
      middleware: middlewares.length > 0
        ? middlewares.length > 1 ? combineMiddlewares(...middlewares) : middlewares[0]
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

