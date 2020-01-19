import { insertIf } from '../../+internal/utils';
import { HttpMiddlewareEffect } from '../effects/http.effects.interface';
import { isRouteEffectGroup } from './http.router.helpers';
import {
  Routing,
  RoutingMethod,
  RoutingItem,
  RouteEffect,
  RouteEffectGroup,
} from './http.router.interface';
import { factorizeRegExpWithParams } from './http.router.params.factory';
import { notFound$ } from './http.router.effects';

const canOverrideRoute = (route: RouteEffect) =>
  route.meta?.overridable === true;

export const factorizeRouting = (
  routes: (RouteEffect | RouteEffectGroup)[],
  middlewares: HttpMiddlewareEffect[] = [],
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
      parameters,
      effect: route.effect,
      meta: route.meta,
      middlewares: [
        ...middlewares,
        ...insertIf(!!route.middleware)(route.middleware),
      ],
    };

    if (foundRoute) {
      if (!canOverrideRoute(route) && foundRoute.methods[route.method]) {
        throw new Error(`Redefinition of route at "${route.method}: ${parentPath + route.path}"`);
      }

      if (canOverrideRoute(route) && foundRoute.methods[route.method]) {
        return;
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

export const factorizeRoutingWithDefaults = (
  routes: (RouteEffect | RouteEffectGroup)[],
  middlewares: HttpMiddlewareEffect[] = [],
): Routing =>
  factorizeRouting([...routes, notFound$], middlewares);
