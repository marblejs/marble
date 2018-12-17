import * as http from 'http';
import * as WebSocket from 'ws';
import { Subject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ExtendedWebSocketClient } from './websocket.interface';
import { WebSocketMiddleware, WebSocketErrorEffect, WebSocketEffect } from './effects/ws-effects.interface';
import { combineMiddlewares, combineWebSocketEffects } from './effects/ws-effects.combiner';
import { jsonTransformer } from './transformer/json.transformer';
import { EventTransformer } from './transformer/transformer.inteface';
import { handleResponse } from './response/ws-response.handler';
import { defaultError$ } from './error/ws-error.effect';

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
  const combinedEffects = combineWebSocketEffects(effects);
  const combinedMiddlewares = combineMiddlewares(middlewares);

  return (httpServer: http.Server) => {
    const server = new WebSocket.Server({ server: httpServer });

    return server.on('connection', client => {
      console.info('connection initialized');

      const extendedClient = client as ExtendedWebSocketClient;
      extendedClient.sendResponse = handleResponse(server, eventTransformer);

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

      client.on('message', event => eventSubject$.next(event));
      client.on('close', () => eventSub.unsubscribe());
    });
  };
};
