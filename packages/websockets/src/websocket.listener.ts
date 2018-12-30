import * as http from 'http';
import * as WebSocket from 'ws';
import { Subject, of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { combineEffects } from '@marblejs/core';
import {
  WebSocketMiddleware,
  WebSocketErrorEffect,
  WebSocketConnectionEffect,
  WebSocketEffect,
} from './effects/ws-effects.interface';
import { jsonTransformer } from './transformer/json.transformer';
import { EventTransformer } from './transformer/transformer.inteface';
import { handleResponse, handleBroadcastResponse } from './response/ws-response.handler';
import {
  extendClientWith,
  handleServerBrokenConnections,
  handleClientBrokenConnection,
  handleClientValidationError,
  extendServerWith,
} from './websocket.helper';
import { WebSocketIncomingData, WebSocketClient, MarbleWebSocketServer } from './websocket.interface';
import { handleEffectsError } from './error/ws-error.handler';
import { provideErrorEffect } from './error/ws-error.provider';

export interface WebSocketListenerConfig<
  Event extends any,
  OutgoingEvent extends any,
  IncomingError extends Error = Error
> {
  effects?: WebSocketEffect<Event, OutgoingEvent>[];
  middlewares?: WebSocketMiddleware<Event, Event>[];
  error?: WebSocketErrorEffect<IncomingError, Event, OutgoingEvent>;
  eventTransformer?: EventTransformer<WebSocketIncomingData, Event>;
  connection?: WebSocketConnectionEffect;
}

export const webSocketListener = <Event, OutgoingEvent, IncomingError extends Error>({
  error,
  effects = [],
  middlewares = [],
  eventTransformer,
  connection = req$ => req$,
}: WebSocketListenerConfig<Event, OutgoingEvent, IncomingError> = {}) => {
  const combinedEffects = combineEffects(...effects);
  const error$ = provideErrorEffect(error, eventTransformer);
  const providedTransformer = eventTransformer || jsonTransformer as EventTransformer<any, any>;

  const onConnection = (server: MarbleWebSocketServer) => (client: WebSocketClient, req: http.IncomingMessage) => {
    const request$ = of(req);
    const extendedClient = extendClientWith({
      sendResponse: handleResponse(client, providedTransformer),
      sendBroadcastResponse: handleBroadcastResponse(server, providedTransformer),
      isAlive: true,
    })(client);

    connection(request$, extendedClient).subscribe(
      () => {
        const incomingEventSubject$ = new Subject<WebSocketIncomingData>();
        const eventSubject$ = new Subject<Event>();

        const decodedEvent$ = incomingEventSubject$.pipe(map(providedTransformer.decode));
        const middlewares$ = middlewares.reduce((e$, middleware) => middleware(e$, extendedClient), decodedEvent$);
        const effects$ = combinedEffects(eventSubject$, extendedClient);

        const subscribeMiddlewares = (input$: Observable<any>) => input$.pipe()
          .subscribe(
            event => eventSubject$.next(event),
            error => handleEffectsError(extendedClient, error$)(error),
          );

        const subscribeEffects = (input$: Observable<any>) => input$
          .subscribe(
            event => extendedClient.sendResponse(event),
            error => handleEffectsError(extendedClient, error$)(error),
          );

        let middlewaresSubscription = subscribeMiddlewares(middlewares$);
        let effectsSubscription = subscribeEffects(effects$);

        extendedClient.on('message', event => {
          if (middlewaresSubscription.closed) {
            middlewaresSubscription = subscribeMiddlewares(middlewares$);
          }

          if (effectsSubscription.closed) {
            effectsSubscription = subscribeEffects(effects$);
          }

          incomingEventSubject$.next(event);
        });

        extendedClient.on('close', () => {
          middlewaresSubscription.unsubscribe();
          effectsSubscription.unsubscribe();
        });
      },
      handleClientValidationError(extendedClient),
    );

    return handleClientBrokenConnection(extendedClient);
  };

  return (httpServer?: http.Server) => {
    const serverOptions: WebSocket.ServerOptions = httpServer
      ? { server: httpServer, }
      : { noServer: true };
    const server = new WebSocket.Server(serverOptions);
    const extendedServer = extendServerWith({
      sendBroadcastResponse: handleBroadcastResponse(server, providedTransformer)
    })(server);

    extendedServer.on('connection', onConnection(extendedServer));
    return handleServerBrokenConnections(extendedServer);
  };
};
