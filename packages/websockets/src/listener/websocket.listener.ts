import * as http from 'http';
import * as WebSocket from 'ws';
import { Subject, of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  combineEffects,
  combineMiddlewares,
  Event,
  httpServerToken,
  createEffectMetadata,
  askContext,
  ContextProvider,
  ContextReader,
} from '@marblejs/core';
import * as WS from '../websocket.interface';
import * as WSHelper from './websocket.helper';
import * as WSEffect from '../effects/ws-effects.interface';
import { jsonTransformer } from '../transformer/json.transformer';
import { EventTransformer } from '../transformer/transformer.inteface';
import { handleResponse, handleBroadcastResponse } from '../response/ws-response.handler';
import { handleEffectsError } from '../error/ws-error.handler';
import { provideErrorEffect } from '../error/ws-error.provider';

type HandleIncomingMessage =
  (client: WS.MarbleWebSocketClient, contextProvider: ContextProvider) =>
  () => void;

type HandleIncomingConnection =
  (server: WS.MarbleWebSocketServer, contextProvider: ContextProvider) =>
  (client: WS.WebSocketClient, request: http.IncomingMessage) =>  void;

export interface WebSocketListenerConfig {
  effects?: WSEffect.WsEffect<any, any>[];
  middlewares?: WSEffect.WsMiddlewareEffect<any, any>[];
  error$?: WSEffect.WsErrorEffect<Error, any, any>;
  eventTransformer?: EventTransformer<Event, any>;
  connection$?: WSEffect.WsConnectionEffect;
  output$?: WSEffect.WsOutputEffect;
}

export const webSocketListener = (config: WebSocketListenerConfig = {}) => {
  const {
    error$,
    effects = [],
    middlewares = [],
    eventTransformer,
    connection$ = (req$: Observable<http.IncomingMessage>) => req$,
    output$ = (out$: Observable<Event>) => out$,
  } = config;

  const combinedMiddlewares = combineMiddlewares(...middlewares);
  const combinedEffects = combineEffects(...effects);
  const providedError$ = provideErrorEffect(error$, eventTransformer);
  const providedTransformer: EventTransformer<any, any> = eventTransformer || jsonTransformer;

  const handleIncomingMessage: HandleIncomingMessage = (client, ask) => () => {
    const subscribeMiddlewares = (input$: Observable<any>) =>
      input$.subscribe(
        event => eventSubject$.next(event),
        error => handleEffectsError(defaultMetadata, client, providedError$)(error),
      );

    const subscribeEffects = (input$: Observable<any>) =>
      input$.subscribe(
        event => client.sendResponse(event),
        error => handleEffectsError(defaultMetadata, client, providedError$)(error),
      );

    const onMessage = (event: WS.WebSocketData) => {
      if (middlewaresSub.closed) { middlewaresSub = subscribeMiddlewares(middlewares$); }
      if (effectsSub.closed) { effectsSub = subscribeEffects(effects$); }
      incomingEventSubject$.next(event);
    };

    const onClose = () => {
      client.removeListener('message', onMessage);
      middlewaresSub.unsubscribe();
      effectsSub.unsubscribe();
    };

    const defaultMetadata = createEffectMetadata({ ask });
    const incomingEventSubject$ = new Subject<WS.WebSocketData>();
    const eventSubject$ = new Subject<any>();
    const decodedEvent$ = incomingEventSubject$.pipe(map(providedTransformer.decode));
    const middlewares$ = combinedMiddlewares(decodedEvent$, client, defaultMetadata);
    const effects$ = combinedEffects(eventSubject$, client, defaultMetadata);
    const effectsOutput$ = output$(effects$, client, defaultMetadata);

    let middlewaresSub = subscribeMiddlewares(middlewares$);
    let effectsSub = subscribeEffects(effectsOutput$);

    client.on('message', onMessage);
    client.once('close', onClose);
  };

  const handleIncomingConnection: HandleIncomingConnection = (server, ask) => (client, req) => {
    const request$ = of(req);
    const defaultMetadata = createEffectMetadata({ ask });
    const extendedClient = WSHelper.extendClientWith({
      sendResponse: handleResponse(client, providedTransformer),
      sendBroadcastResponse: handleBroadcastResponse(server, providedTransformer),
      isAlive: true,
    })(client);

    connection$(request$, extendedClient, defaultMetadata).subscribe(
      handleIncomingMessage(extendedClient, ask),
      WSHelper.handleClientValidationError(extendedClient),
    );

    WSHelper.handleClientBrokenConnection(extendedClient).subscribe();
  };

  return (serverOptions?: WebSocket.ServerOptions): ContextReader => askContext.map(ask => {
    const providedOptions: WebSocket.ServerOptions = serverOptions
      || { server: ask(httpServerToken).getOrElse(undefined as any as http.Server) };
    const webSocketServer = WSHelper.createWebSocketServer(providedOptions);
    const sendBroadcastResponse = handleBroadcastResponse(webSocketServer, providedTransformer);
    const extendedWebSocketServer = WSHelper.extendServerWith({ sendBroadcastResponse })(webSocketServer);

    extendedWebSocketServer.on('connection', handleIncomingConnection(extendedWebSocketServer, ask));
    WSHelper.handleServerBrokenConnections(extendedWebSocketServer).subscribe();

    return extendedWebSocketServer;
  });
};
