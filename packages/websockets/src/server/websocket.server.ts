import * as http from 'http';
import * as WebSocket from 'ws';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
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
  useContext,
  LoggerLevel,
} from '@marblejs/core';
import { isTestEnv, createUuid } from '@marblejs/core/dist/+internal/utils';
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

  const boundLogger = bindTo(LoggerToken)(isTestEnv() ? mockLogger : logger);

  const context = await flow(
    registerAll([
      boundLogger,
      ...dependencies,
    ]),
    logContext(LoggerTag.WEBSOCKETS),
    resolve,
  )(createContext());
  const ask = lookup(context);
  const providedLogger = useContext(LoggerToken)(ask);
  const listener = webSocketListener(context);

  const server = createServer({
    noServer: true,
    verifyClient: verifyClient(context),
    ...options
  }, listener.eventTransformer);

  const listen: ServerIO<WebSocketServerConnection> = () => new Promise((resolve, reject) => {
    handleServerBrokenConnections(server).subscribe();

    server.on('connection', (client: WebSocketClientConnection, req: http.IncomingMessage) => {
      client.sendResponse = handleResponse(client, listener.eventTransformer);
      client.sendBroadcastResponse = handleBroadcastResponse(server, listener.eventTransformer);
      client.isAlive = true;
      client.id = createUuid();
      client.address = req.connection.remoteAddress ?? '-';

      const message = `Connected incoming client "${client.id}" (${client.address})`;
      const log = providedLogger({ tag: LoggerTag.WEBSOCKETS, type: 'Server', message });

      handleClientBrokenConnection(client).subscribe();
      listener(client);
      log();
    });

    if (server.options.noServer) {
      return resolve(server);
    }

    const { port } = server.address() as WebSocket.AddressInfo;
    const DEFAULT_HOSTNAME = '127.0.0.1';
    const hostname = server.options.host ?? DEFAULT_HOSTNAME;

    server.once('error', error => {
      const message = `An error occured while connecting to WebSocket server @ http://${hostname}:${port}/`;
      const log = providedLogger({ tag: LoggerTag.WEBSOCKETS, type: 'Server', message, level: LoggerLevel.ERROR });

      log();
      reject(error);
    });

    server.once('listening', () => {
      const message = `WebSocket server running @ http://${hostname}:${port}/ 🚀`;
      const log = providedLogger({ tag: LoggerTag.WEBSOCKETS, type: 'Server', message });

      log();
      resolve(server);
    });
  });

  listen.context = context;

  return listen;
};
