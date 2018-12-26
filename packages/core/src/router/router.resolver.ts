import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap, takeWhile } from 'rxjs/operators';
import { HttpMethod, HttpRequest, HttpResponse } from '../http.interface';
import { EffectHttpResponse } from '../effects/effects.interface';
import { RouteMatched, Routing, RoutingItem } from './router.interface';
import { queryParamsFactory } from './router.query.factory';
import { InjectionGetter } from '../server/server.injector';
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
  (routing: Routing, inject: InjectionGetter) =>
  (res: HttpResponse) =>
  (req: HttpRequest): Observable<EffectHttpResponse> => {
    if (res.finished) { return EMPTY; }

    const [urlPath, urlQuery] = req.url.split('?');
    const preparedUrlPath = (urlPath + '/').replace(/\/\/+/g, '/');
    const routeMatched = findRoute(routing, preparedUrlPath, req.method);

    if (!routeMatched) { return EMPTY; }

    req.query = queryParamsFactory(urlQuery);
    req.params = routeMatched.params;

    const middleware = routeMatched.middleware;

    return middleware
      ? middleware(of(req), res, inject).pipe(
          takeWhile(() => !res.finished),
          mergeMap(req => routeMatched.effect(of(req), res, inject))
        )
      : routeMatched.effect(of(req), res, inject);
  };
