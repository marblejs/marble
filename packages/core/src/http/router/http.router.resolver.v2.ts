import { Subject, of, fromEvent, Observable } from 'rxjs';
import { takeUntil, share, take, mergeMap, map } from 'rxjs/operators';
import { EffectContext } from '../../effects/effects.interface';
import { HttpServer, HttpRequest } from '../http.interface';
import { defaultError$ } from '../error/http.error.effect';
import { HttpEffectResponse, HttpErrorEffect, HttpOutputEffect } from '../effects/http.effects.interface';
import {
  unexpectedErrorWhileSendingErrorFactory,
  unexpectedErrorWhileSendingOutputFactory,
  errorNotBoundToRequestErrorFactory,
  responseNotBoundToRequestErrorFactory,
} from '../error/http.error.model';
import { useContext } from '../../context/context.hook';
import { HttpRequestBusToken } from '../server/http.server.tokens';
import { Routing, BootstrappedRoutingItem } from './http.router.interface';
import { queryParamsFactory } from './http.router.query.factory';
import { matchRoute } from './http.router.matcher';
import { ROUTE_NOT_FOUND_ERROR } from './http.router.effects';
import { decorateEffect } from './http.router.helpers';
import { combineRouteMiddlewares } from './http.router.combiner';

export const resolveRouting = (
  routing: Routing,
  ctx: EffectContext<HttpServer>,
) => (
  output$?: HttpOutputEffect,
  error$?: HttpErrorEffect,
) => {
  const requestBusSubject = useContext(HttpRequestBusToken)(ctx.ask);
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
      error => { throw unexpectedErrorWhileSendingOutputFactory(error) },
      () => subscribeOutput(stream$),
    );

  const subscribeError = (stream$: Observable<[HttpEffectResponse, HttpRequest]>) =>
    stream$.subscribe(
      ([res, req]) => req.response.send(res),
      error => { throw unexpectedErrorWhileSendingErrorFactory(error) },
      () => subscribeError(stream$),
    );

  subscribeOutput(outputFlow$);
  subscribeError(errorFlow$);

  const bootstrappedRrouting: BootstrappedRoutingItem[] = routing.map(item => ({
    ...item,
    methods: Object.entries(item.methods).reduce((acc, [method, methodItem]) => {
      if (!methodItem) return { [method]: undefined };

      const { middlewares, effect, parameters, meta } = methodItem;
      const subject = new Subject<HttpRequest>();
      const decorate = !meta?.continuous;

      const input$ = subject.asObservable();
      const middleware$ = combineRouteMiddlewares(decorate)(...middlewares)(input$, ctx);
      const effect$ = decorate ? decorateEffect(middleware$) : middleware$;
      const output$ = effect(effect$, ctx).pipe(takeUntil(close$));

      const subscribe = (stream$: Observable<HttpEffectResponse>) =>
        stream$.subscribe(
          res => {
            if (res.request) {
              outputSubject.next({ res, req: res.request });
            } else {
              throw responseNotBoundToRequestErrorFactory(res);
            }
          },
          error => {
            if (error.request) {
              errorSubject.next({ error, req: error.request });
              subscribe(stream$);
            } else {
              throw errorNotBoundToRequestErrorFactory(error);
            }
          },
        );

      subscribe(output$);

      return {
        ...acc,
        [method]: { subject, parameters },
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

    resolvedRoute.subject.next(req);
    requestBusSubject.next(req);
  };

  return {
    resolve,
    errorSubject,
    outputSubject,
  }
};
