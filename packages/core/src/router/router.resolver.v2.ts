import { EMPTY, Subject, zip } from 'rxjs';
import { publish} from 'rxjs/operators';
import { Routing } from './router.interface';
import { EffectContext } from '../effects/effects.interface';
import { HttpServer, HttpRequest, HttpMethod } from '../http.interface';
import { queryParamsFactory } from './router.query.factory';
import { HttpMiddlewareEffect } from '../effects/http-effects.interface';

interface RoutingResolver {
  (routing: Routing, ctx: EffectContext<HttpServer>): (middleware$: HttpMiddlewareEffect) =>
    (req: HttpRequest) => Subject<HttpRequest<unknown, unknown, unknown>>;
}

interface BootstrappedRoutingItem {
  regExp: RegExp;
  path: string;
  methods: Partial<Record<HttpMethod, Subject<HttpRequest>>>;
  parameters?: string[] | undefined;
}

type BootstrappedRouting = BootstrappedRoutingItem[];

export interface RouteMatched {
  subject: Subject<HttpRequest>;
  params: Record<string, string>;
  path: string;
}

export const findRoute = (routing: BootstrappedRouting) => (url: string, method: HttpMethod): RouteMatched | undefined => {
  for (let i = 0; i < routing.length; ++i) {
    const { regExp, methods, path, parameters } = routing[i];
    const match = url.match(regExp);

    if (!match) { continue; }

    const subject = methods[method] || methods['*'];

    if (!subject) { continue; }

    const params = {};

    if (parameters) {
      for (let p = 0; p < parameters.length; p++) {
        params[parameters[p]] = decodeURIComponent(match[p + 1]);
      }
    }

    return { subject, params, path };
  }

  return undefined;
};

export const resolveRouting: RoutingResolver = (routing, ctx) => (globalMiddleware$) => {
  const bootstrappedRrouting: BootstrappedRoutingItem[] = routing.map(item => ({
    ...item,
    methods: Object.entries(item.methods).reduce((acc, [method, methodItem]) => {
      if (!methodItem) return { [method]: undefined };

      const req$ = new Subject<HttpRequest>();

      const subject$ = req$.pipe(
        publish(req$ => globalMiddleware$(req$, ctx)),
        publish(req$ => methodItem.middleware ? methodItem.middleware(req$, ctx) : req$),
        publish(req$ => zip(
          methodItem.effect(req$, ctx),
          req$,
        )),
      );

      subject$.subscribe(([res, req]) => req.response.send(res));

      return { ...acc, [method]: subject$ };
    }, {}),
  }));

  const find = findRoute(bootstrappedRrouting);

  return req => {
    const [urlPath, urlQuery] = req.url.split('?');
    // const path = (urlPath + '/').replace(/\/\/+/g, '/'); // @TODO: think of removing it

    const resolvedRoute = find(urlPath, req.method);

    if (!resolvedRoute) { return EMPTY as any as Subject<HttpRequest>; }

    req.query = queryParamsFactory(urlQuery);
    req.params = resolvedRoute.params;
    req.meta = {};
    req.meta.path = resolvedRoute.path;

    return resolvedRoute.subject;
  };
};
