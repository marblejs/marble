import * as http from 'http';
import * as WebSocket from 'ws';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { lookup, registerAll, createContext, createEffectContext, Context } from '@marblejs/core';
import {
  createServer,
  extendServerWith,
  extendClientWith,
  handleServerBrokenConnections,
  handleClientBrokenConnection,
} from '../server/websocket.server.helper';
import { handleBroadcastResponse, handleResponse } from '../response/websocket.response.handler';
import { WebSocketConnectionError } from '../error/websocket.error.model';
import { WebSocketServerConfig, WebSocketServer } from './websocket.server.interface';

export const createWebSocketServer = (config: WebSocketServerConfig): WebSocketServer => {
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

  const context = registerAll([ ...dependencies ])(createContext());
  const listener = webSocketListener(context);
  const server = createServer({
    noServer: true,
    verifyClient: verifyClient(context),
    ...options,
  });

  const sendBroadcastResponse = handleBroadcastResponse(server, listener.eventTransformer);
  const extendedServer = extendServerWith({ sendBroadcastResponse })(server);

  const listen = async () => {
    extendedServer.on('connection', client => {
      const extendedClient = extendClientWith({
        sendResponse: handleResponse(client, listener.eventTransformer),
        sendBroadcastResponse: handleBroadcastResponse(server, listener.eventTransformer),
        isAlive: true,
      })(client);

      handleClientBrokenConnection(extendedClient).subscribe();
      listener(extendedClient);
    });

    handleServerBrokenConnections(extendedServer).subscribe();

    return extendedServer;
  };

  listen.context = context;

  return listen;
};
