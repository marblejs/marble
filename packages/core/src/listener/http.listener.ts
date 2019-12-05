import { IncomingMessage, OutgoingMessage } from 'http';
import { flow } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import * as R from 'fp-ts/lib/Reader';
import { of, Subject, zip, OperatorFunction } from 'rxjs';
import { catchError, defaultIfEmpty, mergeMap, tap, map, publish } from 'rxjs/operators';
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
import { EffectError } from '../error/error.model';

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
    const request$ = requestSubject$.asObservable();

    const ask = lookup(ctx);
    const client = useContext(ServerClientToken)(ask);
    const effectContext = createEffectContext({ ask, client });
    const combinedMiddlewares = combineMiddlewares(...middlewares);
    const routing = factorizeRouting(effects);
    const defaultResponse = { status: HttpStatus.NOT_FOUND } as HttpEffectResponse;

    const errorGuard: OperatorFunction<[any, HttpRequest], HttpRequest> = flow(
      map(result => {
        if (result[0] instanceof Error) throw new EffectError(result[0], result[1]);
        return result[0];
      }),
    );

    const catchEffectError: OperatorFunction<HttpRequest, Error> = flow(
      catchError(error => of(error)),
    );

    request$.pipe(
      publish(req$ => zip(
        combinedMiddlewares(req$, effectContext).pipe(catchEffectError),
        req$,
      )),
      errorGuard,
      mergeMap(req => {
        return of(req).pipe(
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
    ).subscribe(
      undefined,
      ({ req, error }: EffectError) => {
        error$(of({ req, error }), effectContext).pipe(
          mergeMap(out => output$(of({ req, res: out }), effectContext)),
          tap(req.response.send),
        ).subscribe();
      },
    );

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
