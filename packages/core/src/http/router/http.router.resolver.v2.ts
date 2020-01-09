import { Subject, of, fromEvent, Observable } from 'rxjs';
import { publish, takeUntil, share, take, mergeMap, map} from 'rxjs/operators';
import { EffectContext } from '../../effects/effects.interface';
import { HttpServer, HttpRequest } from '../http.interface';
import { defaultError$ } from '../error/http.error.effect';
import { HttpEffectResponse, HttpErrorEffect, HttpOutputEffect } from '../effects/http.effects.interface';
import { coreErrorFactory, CoreErrorOptions } from '../../error/error.factory';
import { Routing, BootstrappedRoutingItem } from './http.router.interface';
import { queryParamsFactory } from './http.router.query.factory';
import { matchRoute } from './http.router.matcher';
import { ROUTE_NOT_FOUND_ERROR } from './http.router.effects';

const coreErrorOptions: CoreErrorOptions =  { contextMethod: 'resolveRouting', offset: 0 };

export const resolveRouting = (
  routing: Routing,
  ctx: EffectContext<HttpServer>,
) => (
  output$?: HttpOutputEffect,
  error$?: HttpErrorEffect,
) => {
  const close$ = fromEvent(ctx.client, 'close').pipe(take(1), share());
  const outputSubject = new Subject<{ res: HttpEffectResponse; req: HttpRequest}>();
  const errorSubject = new Subject<{ error: Error; req: HttpRequest }>();

  const outputFlow$ = outputSubject.asObservable().pipe(
    takeUntil(close$),
    mergeMap(data => {
      const stream = output$ ? output$(of(data), ctx) : of(data.res);
      return stream.pipe(
        map(res => ([res, data.req] as [HttpEffectResponse, HttpRequest])),
      );
    }),
  );

  const errorFlow$ = errorSubject.asObservable().pipe(
    takeUntil(close$),
    mergeMap(data => {
      const stream = error$ ? error$(of(data), ctx) : defaultError$(of(data), ctx);
      return stream.pipe(
        map(res => ([res, data.req] as [HttpEffectResponse, HttpRequest])),
      );
    }),
  );

  const subscribeOutput = (stream$: Observable<[HttpEffectResponse, HttpRequest]>) =>
    stream$.subscribe(
      ([res, req]) => req.response.send(res),
      error => {
        const coreError = coreErrorFactory(error.message, coreErrorOptions)
        console.error(coreError.stack);
        subscribeOutput(stream$);
      },
      () => subscribeOutput(stream$),
    );

  const subscribeError = (stream$: Observable<[HttpEffectResponse, HttpRequest]>) =>
    stream$.subscribe(
      ([res, req]) => req.response.send(res),
      error => {
        const coreError = coreErrorFactory(error.message, coreErrorOptions)
        console.error(coreError.stack);
        subscribeOutput(stream$);
      },
      () => subscribeError(stream$),
    );

  subscribeOutput(outputFlow$);
  subscribeError(errorFlow$);

  const bootstrappedRrouting: BootstrappedRoutingItem[] = routing.map(item => ({
    ...item,
    methods: Object.entries(item.methods).reduce((acc, [method, methodItem]) => {
      if (!methodItem) return { [method]: undefined };

      const { middleware, effect, parameters } = methodItem;

      const process = (req$: Observable<HttpRequest>) =>
        middleware
          ? effect(middleware(req$, ctx), ctx)
          : effect(req$, ctx);

      return {
        ...acc,
        [method]: {
          process,
          parameters,
        },
      };
    }, {}),
  }));

  const find = matchRoute(bootstrappedRrouting);

  const resolve = (req: HttpRequest) => {
    const [urlPath, urlQuery] = req.url.split('?');
    const resolvedRoute = find(urlPath, req.method);

    if (!resolvedRoute) {
      return errorSubject.next({ req, error: ROUTE_NOT_FOUND_ERROR });
    }

    req.query = queryParamsFactory(urlQuery);
    req.params = resolvedRoute.params;
    req.meta = {};
    req.meta.path = resolvedRoute.path;

    of(req)
      .pipe(
        publish(resolvedRoute.process),
        take(1),
      )
      .subscribe(
        res => outputSubject.next({ res, req }),
        error => errorSubject.next({ error, req }),
      );
  };

  return {
    resolve,
    errorSubject,
    outputSubject,
  }
};
