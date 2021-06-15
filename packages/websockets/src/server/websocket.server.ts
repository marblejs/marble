import * as http from 'http';
import * as net from 'net';
import * as WebSocket from 'ws';
import { Observable, of } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { filter } from 'fp-ts/lib/Array';
import { Context, contextFactory, createEffectContext, ServerIO, LoggerTag, lookup, logContext, combineEffects } from '@marblejs/core';
import { createUuid, isNonNullable, isNullable } from '@marblejs/core/dist/+internal/utils';
import { createServer, handleServerBrokenConnections, handleClientBrokenConnection } from '../server/websocket.server.helper';
import { WebSocketConnectionError } from '../error/websocket.error.model';
import { statusLogger$ } from '../middlewares/websockets.statusLogger.middleware';
import { broadcastEvent, emitEvent } from './websocket.server.response';
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
      .subscribe({
        next: isVerified => callback(isVerified),
        error: (err: WebSocketConnectionError) => callback(false, err.status, err.message),
      });
  };

  const context = await contextFactory(...filter(isNonNullable)(dependencies));

  logContext(LoggerTag.WEBSOCKETS)(context);

  const webSocketListener = listener(context);
  const ctx = createEffectContext({ ask: lookup(context), client: undefined });
  const combinedEvents = event$ ? combineEffects(statusLogger$, event$) : statusLogger$;
  const noServer = true
    && isNullable(options?.server)
    && isNullable(options?.port)
    && isNullable(options?.noServer);

  const server = createServer({
    verifyClient: verifyClient(context),
    noServer,
    ...options
  }, webSocketListener.eventTransformer, context);

  const { serverEvent$, serverEventSubject }  = subscribeWebSocketEvents(server);

  combinedEvents(serverEvent$, ctx)
    .pipe(takeWhile(e => !isCloseEvent(e), true))
    .subscribe();

  const listen: ServerIO<WebSocketServerConnection> = () => new Promise((resolve, reject) => {
    handleServerBrokenConnections(server).subscribe();

    server.on(ServerEventType.CONNECTION, (client: WebSocketClientConnection, req: http.IncomingMessage) => {
      client.once('close', () => serverEventSubject.next(ServerEvent.closeClient(client)));
      client.sendResponse = emitEvent({ client, eventTransformer: webSocketListener.eventTransformer, ask: ctx.ask });
      client.sendBroadcastResponse = broadcastEvent({ server, eventTransformer: webSocketListener.eventTransformer, ask: ctx.ask });
      client.isAlive = true;
      client.id = createUuid();
      client.address = req.connection.remoteAddress ?? '-';

      serverEventSubject.next(ServerEvent.connection(client, req));

      handleClientBrokenConnection(client).subscribe();
      webSocketListener(client);
    });

    if (server.options.server) {
      const serverAddressInfo = server.address() as net.AddressInfo;
      const host = serverAddressInfo.address === '::' ? 'localhost' : serverAddressInfo.address;
      const port = serverAddressInfo.port;
      serverEventSubject.next(ServerEvent.listening(port, host));
    }

    if (server.options.noServer || server.options.server?.listening) {
      return resolve(server);
    }

    if (server.options.server) {
      return server.options.server.once(ServerEventType.LISTENING, () => resolve(server));
    }

    server.once(ServerEventType.ERROR, error => reject(error));
    server.once(ServerEventType.LISTENING, () => resolve(server));
  });

  listen.context = context;

  return listen;
};
