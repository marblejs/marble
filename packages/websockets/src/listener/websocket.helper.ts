import * as WebSocket from 'ws';
import { EMPTY, fromEvent, merge, SchedulerLike, throwError } from 'rxjs';
import {
  MarbleWebSocketClient,
  MarbleWebSocketServer,
  WebSocketClient,
  WebSocketStatus,
  WebSocketServer,
} from '../websocket.interface';
import { WebSocketConnectionError } from '../error/ws-error.model';
import { takeUntil, catchError, tap, mapTo, timeout, map } from 'rxjs/operators';
export { WebSocket };

type ExtendableServerFields = {
  sendBroadcastResponse: MarbleWebSocketServer['sendBroadcastResponse'];
};

type ExtendableClientFields = {
  isAlive: boolean;
  sendResponse: MarbleWebSocketClient['sendResponse'];
  sendBroadcastResponse: MarbleWebSocketClient['sendBroadcastResponse'];
};

export const HEART_BEAT_INTERVAL = 10 * 1000;
export const HEART_BEAT_TERMINATE_INTERVAL = HEART_BEAT_INTERVAL + 1000;

export const createWebSocketServer = (options: WebSocket.ServerOptions) =>
  new WebSocket.Server(options);

export const extendServerWith = (extendableFields: ExtendableServerFields) => (server: WebSocketServer) => {
  const extendedServer = server as MarbleWebSocketServer;

  Object
    .entries(extendableFields)
    .forEach(([key, value]) => extendedServer[key] = value);

  return extendedServer;
};

export const extendClientWith = (extendableFields: ExtendableClientFields) => (client: WebSocketClient) => {
  const extendedClient = client as MarbleWebSocketClient;

  Object
    .entries(extendableFields)
    .forEach(([key, value]) => extendedClient[key] = value);

  return extendedClient;
};

export const handleServerBrokenConnections = (server: WebSocketServer) => {
  setInterval(() => {
    server.clients.forEach((client: WebSocketClient) => {
      const extendedClient = client as MarbleWebSocketClient;

      if (extendedClient.isAlive === false) { return client.terminate(); }

      extendedClient.isAlive = false;
      extendedClient.ping();
    });
  }, HEART_BEAT_INTERVAL);

  return server;
};

export const handleClientBrokenConnection = (client: MarbleWebSocketClient, scheduler?: SchedulerLike) =>
  merge(
    fromEvent(client, 'open'),
    fromEvent(client, 'ping'),
    fromEvent(client, 'pong'),
  )
  .pipe(
    takeUntil(fromEvent(client, 'close')),
    timeout(HEART_BEAT_TERMINATE_INTERVAL, scheduler),
    mapTo(client),
    tap(client => client.isAlive = true),
    map(client => client.isAlive),
    catchError(error => {
      client.terminate();
      return throwError(error);
    }),
  );

export const handleClientValidationError = (client: MarbleWebSocketClient) => (error: WebSocketConnectionError) => {
  client.isAlive = false;
  client.close(error.status || WebSocketStatus.INTERNAL_ERROR, error.message);
  return EMPTY;
};
