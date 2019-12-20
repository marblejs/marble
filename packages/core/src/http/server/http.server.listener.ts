import { IncomingMessage, OutgoingMessage } from 'http';
import { pipe } from 'fp-ts/lib/pipeable';
import * as R from 'fp-ts/lib/Reader';
import { HttpMiddlewareEffect, HttpErrorEffect, HttpOutputEffect } from '../effects/http.effects.interface';
import { HttpRequest, HttpResponse } from '../http.interface';
import { handleResponse } from '../response/http.responseHandler';
import { RouteEffect, RouteEffectGroup, RoutingItem } from '../router/http.router.interface';
import { resolveRouting } from '../router/http.router.resolver.v2';
import { factorizeRoutingWithDefaults } from '../router/http.router.factory';
import { ROUTE_NOT_FOUND_ERROR } from '../router/http.router.effects';
import { Context, lookup } from '../../context/context.factory';
import { createEffectContext } from '../../effects/effectsContext.factory';
import { useContext } from '../../context/context.hook';
import { ServerClientToken } from './http.server.tokens';

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
  output$,
  error$,
}: HttpListenerConfig): R.Reader<Context, HttpListener> => pipe(
  R.ask<Context>(),
  R.map(ctx => {
    const ask = lookup(ctx);
    const client = useContext(ServerClientToken)(ask);
    const effectContext = createEffectContext({ ask, client });
    const routing = factorizeRoutingWithDefaults(effects, middlewares);
    const { resolve, errorSubject } = resolveRouting(routing, effectContext)(output$, error$);

    const httpServer = (req: IncomingMessage, res: OutgoingMessage) => {
      const marbleReq = req as HttpRequest;
      const marbleRes = res as HttpResponse;

      marbleRes.send = handleResponse(ask)(marbleRes)(marbleReq);
      marbleReq.response = marbleRes;

      const routeSubject = resolve(marbleReq);

      if (routeSubject) {
        routeSubject.next(marbleReq);
      } else {
        errorSubject.next({ req: marbleReq, error: ROUTE_NOT_FOUND_ERROR });
      }
    };

    httpServer.config = { routing };

    return httpServer;
  }),
);