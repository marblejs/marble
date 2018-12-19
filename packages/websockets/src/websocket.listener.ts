import * as http from 'http';
import * as WebSocket from 'ws';
import { Subject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { combineMiddlewares, combineEffects } from '@marblejs/core';
import { WebSocketMiddleware, WebSocketErrorEffect, WebSocketEffect } from './effects/ws-effects.interface';
import { jsonTransformer } from './transformer/json.transformer';
import { EventTransformer } from './transformer/transformer.inteface';
import { handleResponse, handleBroadcastResponse } from './response/ws-response.handler';
import { extendClientWith, handleServerBrokenConnections, handleClientBrokenConnection } from './websocket.helper';
import { WebSocketIncomingData, WebSocketClient } from './websocket.interface';
import { errorHandler } from './error/ws-error.handler';

type WebSocketListenerConfig<
  Event extends any,
  OutgoingEvent extends any,
  IncomingError extends Error = Error
> = {
  effects?: WebSocketEffect<Event, OutgoingEvent>[];
  middlewares?: WebSocketMiddleware<Event, Event>[];
  error?: WebSocketErrorEffect<IncomingError, Event, OutgoingEvent>;
  eventTransformer?: EventTransformer<WebSocketIncomingData, Event>;
};

export const webSocketListener = <Event, OutgoingEvent, IncomingError extends Error>({
  error,
  effects = [],
  middlewares = [],
  eventTransformer = jsonTransformer as EventTransformer<any, any>,
}: WebSocketListenerConfig<Event, OutgoingEvent, IncomingError> = {}) => {
  const combinedEffects = combineEffects(effects);
  const combinedMiddlewares = combineMiddlewares(middlewares);

  const onConnection = (server: WebSocket.Server) => (client: WebSocketClient) => {
    const extendedClient = extendClientWith({
      sendResponse: handleResponse(client, server, eventTransformer),
      sendBroadcastResponse: handleBroadcastResponse(client, server, eventTransformer),
      isAlive: true,
    })(client);

    const eventSubject$ = new Subject<WebSocketIncomingData>();
    const event$ = eventSubject$.pipe(map(eventTransformer.decode));
    const middlewares$ = combinedMiddlewares(event$, extendedClient);
    const effects$ = combinedEffects(middlewares$, extendedClient).pipe(
      tap(extendedClient.sendResponse),
      catchError(errorHandler(event$, extendedClient, error)),
    );

    const streamSubscription = effects$.subscribe();

    client.on('message', event => eventSubject$.next(event));
    client.on('close', () => streamSubscription.unsubscribe());

    return handleClientBrokenConnection(extendedClient);
  };

  return (httpServer: http.Server) => {
    const server = new WebSocket.Server({ server: httpServer });
    server.on('connection', onConnection(server));
    return handleServerBrokenConnections(server);
  };
};
