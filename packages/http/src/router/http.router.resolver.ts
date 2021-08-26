import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { takeUntil, share, take, mergeMap, map, catchError } from 'rxjs/operators';
import { flow, pipe } from 'fp-ts/lib/function';
import { EffectContext, useContext, LoggerToken, LoggerTag, LoggerLevel } from '@marblejs/core';
import { throwException } from '@marblejs/core/dist/+internal/utils';
import { HttpServer, HttpRequest, HttpStatus, WithHttpRequest } from '../http.interface';
import { defaultError$ } from '../error/http.error.effect';
import { HttpEffectResponse, HttpErrorEffect, HttpOutputEffect } from '../effects/http.effects.interface';
import {
  unexpectedErrorWhileSendingResponseFactory,
  errorNotBoundToRequestErrorFactory,
  responseNotBoundToRequestErrorFactory,
  isHttpRequestError,
  HttpError
} from '../error/http.error.model';
import { HttpRequestBusToken } from '../server/internal-dependencies/httpRequestBus.reader';
import { requestMetadata$ } from '../effects/http.requestMetadata.effect';
import { provideConfig } from '../http.config';
import { Routing, BootstrappedRoutingItem } from './http.router.interface';
import { queryParamsFactory } from './http.router.query.factory';
import { matchRoute } from './http.router.matcher';
import { ROUTE_NOT_FOUND_ERROR } from './http.router.effects';
import { decorateEffect } from './http.router.helpers';
import { combineRouteMiddlewares } from './http.router.combiner';

type ResolveRoutingConfig = Readonly<{
  routing: Routing,
  ctx: EffectContext<HttpServer>,
  output$?: HttpOutputEffect,
  error$?: HttpErrorEffect,
}>

export const resolveRouting = (config: ResolveRoutingConfig) => {
  const environmentConfig = provideConfig();
  const requestBus = useContext(HttpRequestBusToken)(config.ctx.ask);
  const logger = useContext(LoggerToken)(config.ctx.ask);
  const outputSubject = new Subject<WithHttpRequest<HttpEffectResponse>>();
  const errorSubject = new Subject<WithHttpRequest<{ error: Error }>>();

  /**
   * Server close stream (closes all active streams)
   */
  const close$ = pipe(
    fromEvent(config.ctx.client, 'close'),
    take(1),
    share());

  /**
   * Outgoing response stream (the result triggers HTTP response call)
   */
  const response$ = pipe(
    outputSubject.asObservable(),
    o$ => environmentConfig.useHttpRequestMetadata() ? requestMetadata$(o$, config.ctx) : o$,
    o$ => config.output$ ? config.output$(o$, config.ctx) : o$,
    takeUntil(close$),
  );

  /**
   * Outgoing error response stream (the result triggers HTTP response call)
   */
  const error$ = pipe(
    errorSubject.asObservable(),
    map(({ request, error }) => isHttpRequestError(error) ? { request, error: error.error } : ({ request, error })),
    e$ => config.error$ ? config.error$(e$, config.ctx) : defaultError$(e$, config.ctx),
    takeUntil(close$),
  );

  /**
   * Subscribe to all outgoing HTTP responses and trigger side effect
   * @param stream$ incoming `HttpEffectResponse`
   * @returns `Subscription`
   */
  const subscribeResponse = (stream$: Observable<WithHttpRequest<HttpEffectResponse>>) =>
    stream$
      .pipe(mergeMap(({ request, ...res }) => request.response.send(res)))
      .subscribe({
        error: flow(
          unexpectedErrorWhileSendingResponseFactory,
          throwException),
      });

  subscribeResponse(response$);
  subscribeResponse(error$);

  const bootstrappedRrouting: BootstrappedRoutingItem[] = config.routing.map(item => ({
    ...item,
    methods: Object.entries(item.methods).reduce((acc, [method, methodItem]) => {
      if (!methodItem) return { [method]: undefined };

      const { middlewares, effect, parameters, meta } = methodItem;
      const subject = new Subject<HttpRequest>();
      const decorate = !meta?.continuous;
      const middleware = combineRouteMiddlewares(decorate, errorSubject)(...middlewares);

      logger({
        tag: LoggerTag.HTTP,
        type: 'Router',
        message: `Effect mapped: ${item.path || '/'} ${method}`,
      })();

      const processError = (error: any, originStream$: Observable<any>): Observable<any> => {
        if (!error.request) throw errorNotBoundToRequestErrorFactory(error);
        errorSubject.next({ error, request: error.request });
        return originStream$;
      };

      const output$ = pipe(
        subject.asObservable(),
        e$ => middleware(e$, config.ctx),
        e$ => decorate ? decorateEffect(e$, errorSubject) : e$,
        e$ => effect(e$, config.ctx),
        catchError(processError),
        takeUntil(close$),
      );

      const subscribe = (stream$: Observable<HttpEffectResponse>) =>
        stream$.subscribe({
          next: res => {
            if (!res.request) throw responseNotBoundToRequestErrorFactory(res);
            outputSubject.next({ ...res, request: res.request });
          },
          error: err => {
            const type = 'RouterResolver';
            const message = `Unexpected error for Output stream: "${err.name}", "${err.message}"`;
            logger({ tag: LoggerTag.HTTP, type, message, level: LoggerLevel.ERROR })();
          },
          complete: () => {
            const type = 'RouterResolver';
            const message = `Effect stream completes`;
            logger({ tag: LoggerTag.HTTP, type, message, level: LoggerLevel.DEBUG })();
          },
        });

      subscribe(output$);

      return {
        ...acc,
        [method]: { subject, parameters },
      };
    }, {}),
  }));

  const find = matchRoute(bootstrappedRrouting);

  /**
   * Resolve incoming request
   * @param request `HttpRequest`
   * @returns `void`
   */
  const resolve = (request: HttpRequest) => {
    const [urlPath, urlQuery] = request.url.split('?');

    try {
      const resolvedRoute = find(urlPath, request.method);

      if (!resolvedRoute) {
        return errorSubject.next({ request, error: ROUTE_NOT_FOUND_ERROR });
      }

      request.query = queryParamsFactory(urlQuery);
      request.params = resolvedRoute.params;
      request.meta = {};
      request.meta.path = resolvedRoute.path;

      resolvedRoute.subject.next(request);
      requestBus.next(request);
    } catch (error) {
      if (error.name === 'URIError') {
        return errorSubject.next({ request, error: new HttpError(error.message, HttpStatus.BAD_REQUEST) });
      }

      return errorSubject.next({ request, error: new HttpError(`Internal server error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR) });
    }
  };

  return {
    resolve,
    errorSubject,
    outputSubject,
    response$: merge(response$, error$),
  };
};
