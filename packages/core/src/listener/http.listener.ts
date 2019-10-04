import { IncomingMessage, OutgoingMessage } from 'http';
import { pipe } from 'fp-ts/lib/pipeable';
import * as R from 'fp-ts/lib/Reader';
import { of, Subject } from 'rxjs';
import { catchError, defaultIfEmpty, mergeMap, tap, takeWhile } from 'rxjs/operators';
import { combineMiddlewares } from '../effects/effects.combiner';
import {
  HttpEffectResponse,
  HttpMiddlewareEffect,
  HttpErrorEffect,
  HttpOutputEffect,
} from '../effects/http-effects.interface';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';
import { handleResponse } from '../response/response.handler';
import { RouteEffect, RouteEffectGroup, RoutingItem } from '../router/router.interface';
import { resolveRouting } from '../router/router.resolver';
import { factorizeRouting } from '../router/router.factory';
import { defaultError$ } from '../error/error.effect';
import { Context, lookup } from '../context/context.factory';
import { createEffectMetadata } from '../effects/effectsMetadata.factory';

export interface HttpListenerConfig {
  middlewares?: HttpMiddlewareEffect[];
  effects: (RouteEffect | RouteEffectGroup)[];
  error$?: HttpErrorEffect;
  output$?: HttpOutputEffect;
}

export interface HttpListener {
  (req: IncomingMessage, res: OutgoingMessage): void;
  config: { routing: RoutingItem[] };
};

export const httpListener = ({
  middlewares = [],
  effects,
  error$ = defaultError$,
  output$ = out$ => out$,
}: HttpListenerConfig): R.Reader<Context, HttpListener> => pipe(
  R.ask<Context>(),
  R.map(ctx => {
    const requestSubject$ = new Subject<{ req: HttpRequest; res: HttpResponse }>();
    const combinedMiddlewares = combineMiddlewares(...middlewares);
    const routing = factorizeRouting(effects);
    const defaultMetadata = createEffectMetadata({ ask: lookup(ctx) });
    const defaultResponse = { status: HttpStatus.NOT_FOUND } as HttpEffectResponse;

    requestSubject$.pipe(
      tap(({ req, res }) => res.send = handleResponse(res)(req)),
      mergeMap(({ req, res }) => combinedMiddlewares(of(req), res, defaultMetadata).pipe(
        takeWhile(() => !res.finished),
        mergeMap(resolveRouting(routing, defaultMetadata)(res)),
        defaultIfEmpty(defaultResponse),
        mergeMap(out => output$(of(out), res, createEffectMetadata({ ...defaultMetadata, initiator: req }))),
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

    httpServer.config = { routing };

    return httpServer;
  }),
);
