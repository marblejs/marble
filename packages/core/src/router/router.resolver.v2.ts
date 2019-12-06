import { Subject, zip, OperatorFunction, of } from 'rxjs';
import { publish, catchError, map, mergeMap} from 'rxjs/operators';
import { Routing } from './router.interface';
import { EffectContext } from '../effects/effects.interface';
import { HttpServer, HttpRequest, HttpMethod } from '../http.interface';
import { queryParamsFactory } from './router.query.factory';
import { HttpMiddlewareEffect, HttpEffectResponse, HttpErrorEffect, HttpOutputEffect } from '../effects/http-effects.interface';
import { combineMiddlewares } from '../effects/effects.combiner';
import { flow } from 'fp-ts/lib/function';

interface RoutingResolver {
  (routing: Routing, ctx: EffectContext<HttpServer>):
    (middleware$: HttpMiddlewareEffect, output$: HttpOutputEffect, error$: HttpErrorEffect) =>
      (req: HttpRequest) => {
        inputSubject?: Subject<HttpRequest<unknown, unknown, unknown>>;
        outputSubject: Subject<{ res: HttpEffectResponse; req: HttpRequest}>;
      };
}

interface BootstrappedRoutingItem {
  regExp: RegExp;
  path: string;
  methods: Partial<Record<HttpMethod, {
    input: Subject<HttpRequest>;
    output: Subject<{ req: HttpRequest; res: HttpEffectResponse }>;
  }>>;
  parameters?: string[] | undefined;
}

type BootstrappedRouting = BootstrappedRoutingItem[];

export interface RouteMatched {
  inputSubject: Subject<HttpRequest>;
  outputSubject: Subject<{ req: HttpRequest; res: HttpEffectResponse }>;
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

    return { inputSubject: subject.input, outputSubject: subject.output, params, path };
  }

  return undefined;
};

export const resolveRouting: RoutingResolver = (routing, ctx) => (globalMiddleware$, output$, error$) => {
  const outputSubject = new Subject<{ res: HttpEffectResponse; req: HttpRequest}>();
  const outputStream$ = outputSubject.asObservable();

  zip(
    output$(outputStream$, ctx).pipe(catchError(error => of(error))),
    outputStream$.pipe(map(out => out.req)),
  ).subscribe(([res, req]) => req.response.send(res));

  const bootstrappedRrouting: BootstrappedRoutingItem[] = routing.map(item => ({
    ...item,
    methods: Object.entries(item.methods).reduce((acc, [method, methodItem]) => {
      if (!methodItem) return { [method]: undefined };

      const isError = (data: any): data is Error =>
        !!(data as any).stack;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const errorGuard: OperatorFunction<[HttpEffectResponse, HttpRequest], [HttpEffectResponse, HttpRequest]> = flow(
        mergeMap(response =>
          isError(response[0])
            ? error$(of({ error: response[0], req: response[1] }), ctx)
              .pipe(map(res => [res, response[1]] as [HttpEffectResponse, HttpRequest]))
            : of(response)
        ),
      );

      const { middleware, effect } = methodItem;

      const inputSubject = new Subject<HttpRequest>();
      const inputStream$ = inputSubject.asObservable();

      const middleware$ = combineMiddlewares(globalMiddleware$, middleware);

      zip(
        inputStream$.pipe(
          publish(req$ => middleware$(req$, ctx)),
          publish(req$ => effect(req$, ctx)),
          catchError(error => of(error)),
        ),
        inputStream$,
      )
        .subscribe(([res, req]) => outputSubject.next({ req, res }));

      return { ...acc, [method]: { input: inputSubject, output: outputSubject } };
    }, {}),
  }));

  const find = findRoute(bootstrappedRrouting);

  return req => {
    const [urlPath, urlQuery] = req.url.split('?');
    // const path = (urlPath + '/').replace(/\/\/+/g, '/'); // @TODO: think of removing it

    const resolvedRoute = find(urlPath, req.method);

    if (!resolvedRoute) { return { outputSubject }; }

    req.query = queryParamsFactory(urlQuery);
    req.params = resolvedRoute.params;
    req.meta = {};
    req.meta.path = resolvedRoute.path;

    return { inputSubject: resolvedRoute.inputSubject, outputSubject: resolvedRoute.outputSubject };
  };
};
