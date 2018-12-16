import * as http from 'http';
import * as WebSocket from 'ws';
import { Subject, of } from 'rxjs';
import { tap, mergeMap, catchError, map } from 'rxjs/operators';
import { Socket, ExtendedWebSocketClient } from './websocket.interface';
import { WebSocketMiddleware, WebSocketErrorEffect } from './effects/ws-effects.interface';
import { combineWebSocketMiddlewares } from './effects/ws-effects.combiner';
import { factorizeRouting } from './router/ws-router.factory';
import { resolveRouting } from './router/ws-router.resolver';
import { WebSocketRoute } from './router/ws-router.interface';
import { jsonTransformer } from './transformer/json.transformer';
import { EventTransformer } from './transformer/transformer.inteface';
import { handleResponse } from './response/ws-response.handler';
import { defaultError$ } from './error/ws-error.effect';

type WebSocketListenerConfig = {
  effects?: WebSocketRoute[];
  middlewares?: WebSocketMiddleware[];
  errorEffect?: WebSocketErrorEffect;
  eventTransformer?: EventTransformer;
};

export const webSocketListener = ({
  middlewares = [],
  effects = [],
  eventTransformer = jsonTransformer,
  errorEffect = defaultError$,
}: WebSocketListenerConfig = {}) => {
  const socket$ = new Subject<Socket>();
  const routing = factorizeRouting(effects, middlewares);
  const combinedMiddlewares = combineWebSocketMiddlewares(middlewares);

  const effect$ = socket$.pipe(
    map(socket => ({ ...socket, event: eventTransformer.decode(socket.event) })),
    map(socket => ({ ...socket, client: socket.client as ExtendedWebSocketClient })),
    tap(socket => socket.client.sendResponse = handleResponse(socket, eventTransformer)),
    mergeMap(({ event, client }) =>
      combinedMiddlewares(of(event), client, undefined).pipe(
        mergeMap(resolveRouting(routing)(client)),
        tap(client.sendResponse),
        catchError(error =>
          errorEffect(of(event), client, error).pipe(
            tap(client.sendResponse)
          )
        )
      ),
    ),
  );

  effect$.subscribe();

  return (httpServer: http.Server) => {
    const server = new WebSocket.Server({ server: httpServer });

    return server.on('connection', client =>
      client.on('message', event =>
        socket$.next({ event, server, client }),
      ),
    );
  };
};
