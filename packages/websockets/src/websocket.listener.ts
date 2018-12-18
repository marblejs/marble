import * as http from 'http';
import * as WebSocket from 'ws';
import { Subject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { combineMiddlewares, combineEffects } from '@marblejs/core';
import { WebSocketMiddleware, WebSocketErrorEffect, WebSocketEffect } from './effects/ws-effects.interface';
import { jsonTransformer } from './transformer/json.transformer';
import { EventTransformer } from './transformer/transformer.inteface';
import { handleResponse } from './response/ws-response.handler';
import { defaultError$ } from './error/ws-error.effect';
import { extendClientWith, handleBrokenConnections } from './websocket.helper';
import { ExtendedWebSocketClient } from './websocket.interface';

type WebSocketListenerConfig = {
  effects?: WebSocketEffect[];
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
  const heartbeatInterval = 10 * 1000;
  const combinedEffects = combineEffects(effects);
  const combinedMiddlewares = combineMiddlewares(middlewares);

  return (httpServer: http.Server) => {
    const server = new WebSocket.Server({ server: httpServer });

    server.on('connection', client => {
      let pingTimeout;

      const extendedClient = extendClientWith({
        sendResponse: handleResponse(server, eventTransformer),
        isAlive: true,
      })(client);

      const eventSubject$ = new Subject<any>();
      const event$ = eventSubject$.pipe(map(eventTransformer.decode));
      const middlewares$ = combinedMiddlewares(event$, extendedClient);
      const effects$ = combinedEffects(middlewares$, extendedClient).pipe(
        tap(extendedClient.sendResponse),
        catchError(error =>
          errorEffect(event$, extendedClient, error).pipe(
            tap(extendedClient.sendResponse)
          ),
        ),
      );

      const eventSub = effects$.subscribe();

      const heartbeat = (client: ExtendedWebSocketClient) => () => {
        client.isAlive = true;
        clearTimeout(pingTimeout);
        pingTimeout = setTimeout(() => client.terminate(), heartbeatInterval + 1000);
      };

      const teardown = () => {
        eventSub.unsubscribe();
        clearTimeout(pingTimeout);
      };

      client.on('open', heartbeat(extendedClient));
      client.on('ping', heartbeat(extendedClient));
      client.on('pong', heartbeat(extendedClient));
      client.on('message', event => eventSubject$.next(event));
      client.on('close', teardown);
    });

    return handleBrokenConnections(heartbeatInterval)(server);
  };
};
