import { EMPTY, Observable, of } from 'rxjs';
import { HttpMethod, HttpRequest, HttpResponse } from '../http.interface';
import { Effect, EffectResponse } from '../effects/effects.interface';
import { createRegExpWithParams, isRouteCombinerConfig, isRouteGroup } from './router.helpers';
import {
  RouteCombinerConfig,
  RouteConfig,
  RouteEffects,
  RouteGroup,
  RouteMatched,
  Routing,
  RoutingMethod,
  RoutingItem
} from './router.interface';
import { queryParamsFactory } from '../router/queryParams.factory';
import { combineMiddlewareEffects } from '../effects/effects.combiner';

export const combineRoutes = (
  path: string,
  configOrEffects: RouteCombinerConfig | RouteEffects[]
): RouteGroup => ({
  path,
  effects: isRouteCombinerConfig(configOrEffects) ? configOrEffects.effects : configOrEffects,
  middlewares: isRouteCombinerConfig(configOrEffects) ? (configOrEffects.middlewares || []) : [],
});

export const routingFactory = (
  routes: (RouteGroup | RouteConfig)[],
  parentPath = '',
  middleware: Effect<HttpRequest>[] = []
): Routing => {
  const routing: Routing = [];
  routes.forEach(route => {
    if (isRouteGroup(route)) {
      routing.push(...routingFactory(
        route.effects,
        parentPath + route.path,
        [...middleware, ...route.middlewares]
      ));
    } else {
      const { regExp, parameters } = createRegExpWithParams(parentPath + route.path);
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
        foundRoute.methods[route.method] = method;
      } else {
        routing.push({
          regExp,
          methods: { [route.method]: method },
        } as RoutingItem);
      }
    }
  });
  return routing;
};

export const findRoute = (
  routing: Routing,
  url: string,
  method: HttpMethod
): RouteMatched | undefined => {
  for (let i = 0; i < routing.length; ++i) {
    const { regExp, methods } = routing[i];

    const match = url.match(regExp);
    if (!match) {
      continue;
    }

    const routingMethod = methods[method];
    if (!routingMethod) {
      return undefined;
    }
    const { parameters, effect, middleware } = routingMethod;
    const params = {};
    if (parameters) {
      for (let p = 0; p < parameters.length; p++) {
        params[parameters[p]] = decodeURIComponent(match[p + 1]);
      }
    }
    return { middleware, effect, params };
  }
  return undefined;
};

export const resolveRouting =
  (routing: Routing) => (res: HttpResponse) => (req: HttpRequest): Observable<EffectResponse> => {
    const [urlPath, urlQuery] = req.url.split('?');
    const routeMatched: RouteMatched | undefined = findRoute(routing, urlPath, req.method);

    if (!routeMatched) {
      return EMPTY;
    }

    req.query = queryParamsFactory(urlQuery);
    req.params = routeMatched.params;
    const middleware = routeMatched.middleware;
    const req$ = of(req);
    if (middleware) {
      return routeMatched.effect(middleware(req$, res, null), res, null);
    }
    return routeMatched.effect(req$, res, null);
  };
