import { IncomingMessage, OutgoingMessage } from 'http';
import { createEffectContext, useContext, createListener } from '@marblejs/core';
import { HttpMiddlewareEffect, HttpErrorEffect, HttpOutputEffect } from '../effects/http.effects.interface';
import { HttpRequest, HttpResponse } from '../http.interface';
import { handleResponse } from '../response/http.responseHandler';
import { RouteEffect, RouteEffectGroup, Routing } from '../router/http.router.interface';
import { resolveRouting } from '../router/http.router.resolver.v2';
import { factorizeRoutingWithDefaults } from '../router/http.router.factory';
import { HttpServerClientToken } from './internal-dependencies/httpServerClient.reader';

export interface HttpListenerConfig {
  effects?: (RouteEffect | RouteEffectGroup)[];
  middlewares?: HttpMiddlewareEffect[];
  error$?: HttpErrorEffect;
  output$?: HttpOutputEffect;
}

export interface HttpListener {
  (req: IncomingMessage, res: OutgoingMessage): void;
  config: { routing: Routing };
}

export const httpListener = createListener<HttpListenerConfig, HttpListener>(config => ask => {
  const {
    effects = [],
    middlewares = [],
    output$,
    error$,
  } = config ?? {};

  const client = useContext(HttpServerClientToken)(ask);
  const effectContext = createEffectContext({ ask, client });
  const routing = factorizeRoutingWithDefaults(effects, middlewares ?? []);
  const { resolve } = resolveRouting(routing, effectContext)(output$, error$);

  const handle = (req: IncomingMessage, res: OutgoingMessage) => {
    const marbleReq = req as HttpRequest;
    const marbleRes = res as HttpResponse;

    marbleRes.send = handleResponse(ask)(marbleRes)(marbleReq);
    marbleReq.response = marbleRes;

    resolve(marbleReq);
  };

  handle.config = { routing };

  return handle;
});
