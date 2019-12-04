import { IncomingMessage, OutgoingMessage } from 'http';
import { pipe } from 'fp-ts/lib/pipeable';
import * as R from 'fp-ts/lib/Reader';
import { of, Subject } from 'rxjs';
import { catchError, defaultIfEmpty, mergeMap, tap, takeWhile, map } from 'rxjs/operators';
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
import { createEffectContext } from '../effects/effectsContext.factory';
import { useContext } from '../context/context.hook';
import { ServerClientToken } from '../server/server.tokens';

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
  output$ = out$ => out$.pipe(map(o => o.res)),
}: HttpListenerConfig): R.Reader<Context, HttpListener> => pipe(
  R.ask<Context>(),
  R.map(ctx => {
    const requestSubject$ = new Subject<HttpRequest>();

    const ask = lookup(ctx);
    const client = useContext(ServerClientToken)(ask);
    const effectContext = createEffectContext({ ask, client });
    const combinedMiddlewares = combineMiddlewares(...middlewares);
    const routing = factorizeRouting(effects);
    const defaultResponse = { status: HttpStatus.NOT_FOUND } as HttpEffectResponse;

    requestSubject$.pipe(
      mergeMap(req => {
        return combinedMiddlewares(of(req), effectContext).pipe(
          takeWhile(() => !req.response.finished),
          mergeMap(resolveRouting(routing, effectContext)),
          defaultIfEmpty(defaultResponse),
          mergeMap(out => output$(of({ req, res: out }), effectContext)),
          tap(req.response.send),
          catchError(error =>
            error$(of({ req, error }), effectContext).pipe(
              mergeMap(out => output$(of({ req, res: out }), effectContext)),
              tap(req.response.send),
            ),
          ),
        );
      }),
    ).subscribe();

    const httpServer = (req: IncomingMessage, res: OutgoingMessage) => {
      const marbleReq = req as HttpRequest;
      const marbleRes = res as HttpResponse;

      marbleRes.send = handleResponse(marbleRes)(marbleReq);
      marbleReq.response = marbleRes;

      return requestSubject$.next(marbleReq);
    };

    httpServer.config = { routing };

    return httpServer;
  }),
);
