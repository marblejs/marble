import { Observable, empty, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpResponse, HttpRequest, HttpMethod } from '../http.interface';
import { EffectResponse } from '../effects/effects.interface';
import { isRouteGroup, isRoutingGroup, isRouteCombinerConfig } from './router.helpers';
import {
  RouteConfig,
  Routing,
  RouteGroup,
  RoutingGroup,
  RoutingRoute,
  RouteCombinerConfig,
  RouteEffects,
} from './router.interface';
import { queryParamsFactory } from '../router/queryParams.factory';

export const combineRoutes = (
  path: string,
  configOrEffects: RouteCombinerConfig | RouteEffects[]
): RouteGroup => ({
  path,
  effects: isRouteCombinerConfig(configOrEffects) ? configOrEffects.effects : configOrEffects,
  middlewares: isRouteCombinerConfig(configOrEffects) ? (configOrEffects.middlewares || []) : [],
});

export const routingFactory = (routes: (RouteGroup | RouteConfig)[]): Routing =>
  routes.map(route => isRouteGroup(route)
    ? [route.path, [...routingFactory(route.effects)]] as RoutingGroup
    : [route.path, route.method, route.effect] as RoutingRoute
  );

export const findRoute = (
  routing: Routing,
  matchUrl: string,
  matchMethod: HttpMethod,
  matchHistory = ''
): RoutingRoute | undefined => {
    for (let i = 0; i < routing.length; ++i) {
      const route = routing[i];

      if (isRoutingGroup(route)) {
        const [routePath, nestedRouting] = route;
        const matcher = matchHistory + routePath;
        const isMatched = new RegExp(`^${matcher}`).test(matchUrl);

        if (isMatched) {
          return findRoute(nestedRouting, matchUrl, matchMethod, matcher);
        }
      }

      const [routePath, routeMethod] = route;
      const matcher = matchHistory + (routePath === '/' ?  '' : routePath);
      const isMatched = new RegExp(`^${matcher}\\??[^\/]*$`).test(matchUrl) && routeMethod === matchMethod;

      if (isMatched) {
        return route as RoutingRoute;
      }
    }

    return undefined;
  };

export const resolveRouting =
  (routing: Routing) =>
  (res: HttpResponse) =>
  (req: HttpRequest): Observable<EffectResponse> => {
    const routeMatched = findRoute(
      routing,
      req.url,
      req.method,
    );

    if (!routeMatched) { return empty(); }

    const req$ = of(req).pipe(
      tap(req => {
        req.query = queryParamsFactory(req.url);
      })
    );

    return routeMatched[2](req$, res, null);
  };
