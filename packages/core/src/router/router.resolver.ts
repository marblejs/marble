import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { HttpMethod, HttpRequest, HttpResponse } from '../http.interface';
import { EffectResponse } from '../effects/effects.interface';
import { RouteMatched, Routing, RoutingItem } from './router.interface';
import { queryParamsFactory } from './router.query.factory';
export { RoutingItem };

export const findRoute = (
  routing: Routing,
  url: string,
  method: HttpMethod
): RouteMatched | undefined => {
  for (let i = 0; i < routing.length; ++i) {
    const { regExp, methods } = routing[i];
    const match = url.match(regExp);

    if (!match) { continue; }

    const routingMethod = methods[method] || methods['*'];

    if (!routingMethod) { continue; }

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
  (routing: Routing) =>
  (res: HttpResponse) =>
  (req: HttpRequest): Observable<EffectResponse> => {
    if (res.finished) { return EMPTY; }

    const [urlPath, urlQuery] = req.url.split('?');
    const preparedUrlPath = (urlPath + '/').replace(/\/\/+/g, '/');
    const routeMatched = findRoute(routing, preparedUrlPath, req.method);

    if (!routeMatched) { return EMPTY; }

    req.query = queryParamsFactory(urlQuery);
    req.params = routeMatched.params;

    const middleware = routeMatched.middleware;

    return middleware
      ? middleware(of(req), res, null).pipe(
          mergeMap(req => routeMatched.effect(of(req), res, null))
        )
      : routeMatched.effect(of(req), res, null);
  };
