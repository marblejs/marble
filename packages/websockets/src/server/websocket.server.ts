import * as http from 'http';
import * as WebSocket from 'ws';
import { Observable, of } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { flow } from 'fp-ts/lib/function';
import {
  bindTo,
  Context,
  createContext,
  createEffectContext,
  registerAll,
  resolve,
  ServerIO,
  mockLogger,
  LoggerToken,
  LoggerTag,
  lookup,
  logger,
  logContext,
  combineEffects,
} from '@marblejs/core';
import { isTestEnv, createUuid } from '@marblejs/core/dist/+internal/utils';
import { createServer, handleServerBrokenConnections, handleClientBrokenConnection } from '../server/websocket.server.helper';
import { handleBroadcastResponse, handleResponse } from '../response/websocket.response.handler';
import { WebSocketConnectionError } from '../error/websocket.error.model';
import { statusLogger$ } from '../middlewares/websockets.statusLogger.middleware';
import { WebSocketServerConfig, WebSocketClientConnection, WebSocketServerConnection } from './websocket.server.interface';
import { subscribeWebSocketEvents } from './websocket.server.event.subscriber';
import { isCloseEvent, ServerEventType, ServerEvent } from './websocket.server.event';

export const createWebSocketServer = async (config: WebSocketServerConfig) => {
  const {
    event$,
    options,
    dependencies = [],
    listener,
    connection$ = (req$: Observable<http.IncomingMessage>) => req$,
  } = config;

  /**
   * @deprecated legacy API - will be removed in version v4
   */
  const verifyClient = (context: Context): WebSocket.VerifyClientCallbackAsync => (info, callback) => {
    connection$(of(info.req), createEffectContext({ ask: lookup(context), client: undefined }))
      .pipe(map(Boolean))
      .subscribe(
        isVerified => callback(isVerified),
        (error: WebSocketConnectionError) => callback(false, error.status, error.message),
      );
  };

  const boundLogger = bindTo(LoggerToken)(isTestEnv() ? mockLogger : logger);

  const context = await flow(
    registerAll([boundLogger, ...dependencies]),
    logContext(LoggerTag.WEBSOCKETS),
    resolve,
  )(createContext());

  const webSocketListener = listener(context);
  const ctx = createEffectContext({ ask: lookup(context), client: undefined });
  const combinedEvents = event$ ? combineEffects(statusLogger$, event$) : statusLogger$;

  const server = createServer({
    noServer: true,
    verifyClient: verifyClient(context),
    ...options
  }, webSocketListener.eventTransformer);

  const { serverEvent$, serverEventSubject }  = subscribeWebSocketEvents(server);

  combinedEvents(serverEvent$, ctx)
    .pipe(takeWhile(e => !isCloseEvent(e), true))
    .subscribe();

  const listen: ServerIO<WebSocketServerConnection> = () => new Promise((resolve, reject) => {
    handleServerBrokenConnections(server).subscribe();

    server.once(ServerEventType.CONNECTION, (client: WebSocketClientConnection, req: http.IncomingMessage) => {
      client.sendResponse = handleResponse(client, webSocketListener.eventTransformer);
      client.sendBroadcastResponse = handleBroadcastResponse(server, webSocketListener.eventTransformer);
      client.isAlive = true;
      client.id = createUuid();
      client.address = req.connection.remoteAddress ?? '-';

      serverEventSubject.next(ServerEvent.connection(client, req));

      handleClientBrokenConnection(client).subscribe();
      webSocketListener(client);
    });

    if (server.options.noServer) {
      return resolve(server);
    }

    server.once(ServerEventType.ERROR, error => reject(error));
    server.once(ServerEventType.LISTENING, () => resolve(server));
  });

  listen.context = context;

  return listen;
};
