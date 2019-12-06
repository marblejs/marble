import { Subject, zip, OperatorFunction, of, fromEvent, Observable } from 'rxjs';
import { publish, catchError, map, filter, takeUntil} from 'rxjs/operators';
import { Routing, BootstrappedRoutingItem } from './router.interface';
import { EffectContext } from '../effects/effects.interface';
import { HttpServer, HttpRequest } from '../http.interface';
import { queryParamsFactory } from './router.query.factory';
import { defaultError$ } from '../error/error.effect';
import { HttpMiddlewareEffect, HttpEffectResponse, HttpErrorEffect, HttpOutputEffect } from '../effects/http-effects.interface';
import { combineMiddlewares } from '../effects/effects.combiner';
import { matchRoute } from './router.matcher';
import { isError } from '../+internal/utils';

export const resolveRouting = (
  routing: Routing,
  ctx: EffectContext<HttpServer>,
) => (
  globalMiddleware$?: HttpMiddlewareEffect,
  output$?: HttpOutputEffect,
  error$?: HttpErrorEffect,
) => {
  const close$ = new Subject();

  fromEvent(ctx.client, 'close')
    .subscribe(() => close$.next());

  const outputSubject = new Subject<{ res: HttpEffectResponse; req: HttpRequest}>();
  const outputStream$ = outputSubject.asObservable().pipe(takeUntil(close$));

  const errorSubject = new Subject<{ error: Error; req: HttpRequest }>();
  const errorStream$ = errorSubject.asObservable().pipe(takeUntil(close$));

  const outputEffect = output$
    ? output$(outputStream$, ctx).pipe(catchError(error => of(error)))
    : outputStream$.pipe(map(({ res }) => res));

  const errorEffect = error$
    ? error$(errorStream$, ctx)
    : defaultError$(errorStream$, ctx);

  const errorGuard: OperatorFunction<[HttpEffectResponse, HttpRequest], [HttpEffectResponse, HttpRequest]> =
    filter(response => {
      if (isError(response[0])) {
        errorSubject.next({ error: response[0], req: response[1] });
        return false;
      }

      return true;
    });

  const outputFlow$ = zip(
    outputEffect,
    outputStream$.pipe(map(out => out.req)),
  );

  const errorFlow$ = zip(
    errorEffect,
    errorStream$.pipe(map(err => err.req)),
  );

  const subscribeOutput = (stream$: Observable<any>) =>
    stream$.subscribe(
      ([res, req]) => req.response.send(res),
      undefined,
      () => subscribeOutput(stream$),
    );

  const subscribeError = (stream$: Observable<any>) =>
    stream$.subscribe(
      ([res, req]) => req.response.send(res),
      undefined,
      () => subscribeError(stream$),
    );

  subscribeOutput(outputFlow$);
  subscribeError(errorFlow$);

  const bootstrappedRrouting: BootstrappedRoutingItem[] = routing.map(item => ({
    ...item,
    methods: Object.entries(item.methods).reduce((acc, [method, methodItem]) => {
      if (!methodItem) return { [method]: undefined };

      const { middleware, effect, parameters } = methodItem;

      const inputSubject = new Subject<HttpRequest>();
      const inputStream$ = inputSubject.asObservable().pipe(takeUntil(close$));

      const middleware$ = combineMiddlewares(r$ => r$, globalMiddleware$, middleware);

      const subscribe = (stream$: Observable<any>) =>
        stream$.subscribe(
          ([res, req]) => outputSubject.next({ req, res }),
          undefined,
          () => subscribe(stream$),
        );

      const flow$ = zip(
        inputStream$.pipe(
          publish(req$ => middleware$(req$, ctx)),
          publish(req$ => effect(req$, ctx)),
          catchError(error => of(error)),
        ),
        inputStream$,
      ).pipe(errorGuard)

      subscribe(flow$);

      return { ...acc, [method]: { subject: inputSubject, parameters } };
    }, {}),
  }));

  const find = matchRoute(bootstrappedRrouting);

  const resolve = (req: HttpRequest) => {
    const [urlPath, urlQuery] = req.url.split('?');
    const resolvedRoute = find(urlPath, req.method);

    if (!resolvedRoute) { return; }

    req.query = queryParamsFactory(urlQuery);
    req.params = resolvedRoute.params;
    req.meta = {};
    req.meta.path = resolvedRoute.path;

    return resolvedRoute.subject;
  };

  return {
    resolve,
    errorSubject,
    outputSubject,
  }
};
