import * as http from 'http';
import * as WebSocket from 'ws';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { flow } from 'fp-ts/lib/function';
import { lookup, registerAll, createContext, createEffectContext, Context, resolve, ServerIO } from '@marblejs/core';
import { createServer, handleServerBrokenConnections, handleClientBrokenConnection } from '../server/websocket.server.helper';
import { handleBroadcastResponse, handleResponse } from '../response/websocket.response.handler';
import { WebSocketConnectionError } from '../error/websocket.error.model';
import { WebSocketServerConfig, WebSocketClientConnection, WebSocketServerConnection } from './websocket.server.interface';

export const createWebSocketServer = async (config: WebSocketServerConfig) => {
  const {
    options,
    dependencies = [],
    webSocketListener,
    connection$ = (req$: Observable<http.IncomingMessage>) => req$,
  } = config;

  const verifyClient = (context: Context): WebSocket.VerifyClientCallbackAsync => (info, callback) => {
    connection$(of(info.req), createEffectContext({ ask: lookup(context), client: undefined }))
      .pipe(map(Boolean))
      .subscribe(
        isVerified => callback(isVerified),
        (error: WebSocketConnectionError) => callback(false, error.status, error.message),
      );
  };

  const context = await flow(
    registerAll([ ...dependencies ]),
    resolve,
  )(createContext());

  const listener = webSocketListener(context);

  const server = createServer({
    noServer: true,
    verifyClient: verifyClient(context),
    ...options
  }, listener.eventTransformer);

  const listen: ServerIO<WebSocketServerConnection> = async () => {
    server.on('connection', (client: WebSocketClientConnection) => {
      client.sendResponse = handleResponse(client, listener.eventTransformer);
      client.sendBroadcastResponse = handleBroadcastResponse(server, listener.eventTransformer);
      client.isAlive = true;

      handleClientBrokenConnection(client).subscribe();
      listener(client);
    });

    handleServerBrokenConnections(server).subscribe();

    return server;
  };

  listen.context = context;

  return listen;
};
