import { IncomingMessage, OutgoingMessage } from 'http';
import { of, Subject } from 'rxjs';
import { catchError, defaultIfEmpty, mergeMap, tap, takeWhile } from 'rxjs/operators';
import { combineMiddlewares } from '../effects/effects.combiner';
import { EffectHttpResponse, Middleware, ErrorEffect, OutputEffect } from '../effects/effects.interface';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';
import { handleResponse } from '../response/response.handler';
import { RouteEffect, RouteEffectGroup } from '../router/router.interface';
import { resolveRouting } from '../router/router.resolver';
import { factorizeRouting } from '../router/router.factory';
import { defaultError$ } from '../error/error.effect';
import { createStaticInjectionContainer } from '../server/server.injector';
import { createEffectMetadata } from '../effects/effectsMetadata.factory';

export interface HttpListenerConfig {
  middlewares?: Middleware[];
  effects: (RouteEffect | RouteEffectGroup)[];
  error$?: ErrorEffect;
  output$?: OutputEffect;
}

export const httpListener = ({
  middlewares = [],
  effects,
  error$ = defaultError$,
  output$ = out$ => out$,
}: HttpListenerConfig) => {
  const requestSubject$ = new Subject<{ req: HttpRequest; res: HttpResponse; }>();
  const combinedMiddlewares = combineMiddlewares(...middlewares);
  const routing = factorizeRouting(effects);
  const injector = createStaticInjectionContainer();
  const defaultMetadata = createEffectMetadata({ inject: injector.get });
  const defaultResponse = { status: HttpStatus.NOT_FOUND } as EffectHttpResponse;

  requestSubject$.pipe(
    tap(({ req, res }) => res.send = handleResponse(res)(req)),
    mergeMap(({ req, res }) => combinedMiddlewares(of(req), res, defaultMetadata).pipe(
      takeWhile(() => !res.finished),
      mergeMap(resolveRouting(routing, defaultMetadata)(res)),
      defaultIfEmpty(defaultResponse),
      mergeMap(out => output$(of(out), res, defaultMetadata)),
      tap(res.send),
      catchError(error =>
        error$(of(req), res, createEffectMetadata({ ...defaultMetadata, error })).pipe(
          mergeMap(out => output$(of(out), res, createEffectMetadata({ ...defaultMetadata, error }))),
          tap(res.send),
        ),
      ),
    )),
  ).subscribe();

  const httpServer = (req: IncomingMessage, res: OutgoingMessage) => requestSubject$.next({
    req: req as HttpRequest,
    res: res as HttpResponse,
  });

  httpServer.config = {
    routing,
    injector,
  };

  return httpServer;
};
