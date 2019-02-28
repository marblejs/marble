import * as WebSocket from 'ws';
import { EMPTY, fromEvent, merge, SchedulerLike, throwError, interval, from, iif, of } from 'rxjs';
import {
  MarbleWebSocketClient,
  MarbleWebSocketServer,
  WebSocketClient,
  WebSocketStatus,
  WebSocketServer,
} from '../websocket.interface';
import { WebSocketConnectionError } from '../error/ws-error.model';
import { takeUntil, catchError, tap, mapTo, timeout, map, mergeMap, mergeMapTo } from 'rxjs/operators';
export { WebSocket };

type ExtendableServerFields = {
  sendBroadcastResponse: MarbleWebSocketServer['sendBroadcastResponse'];
};

type ExtendableClientFields = {
  isAlive: boolean;
  sendResponse: MarbleWebSocketClient['sendResponse'];
  sendBroadcastResponse: MarbleWebSocketClient['sendBroadcastResponse'];
};

export enum ClientStatus {
  ALIVE,
  DEAD,
}

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

export const handleServerBrokenConnections = (server: WebSocketServer, scheduler?: SchedulerLike) =>
  interval(HEART_BEAT_INTERVAL, scheduler).pipe(
    takeUntil(fromEvent(server, 'close')),
    mergeMapTo(from(server.clients)),
    map(client => client as MarbleWebSocketClient),
    mergeMap(client => iif(
      () => !client.isAlive,
      of(client).pipe(
        tap(client => client.isAlive = false),
        tap(() => client.terminate()),
        mapTo(ClientStatus.DEAD),
      ),
      of(client).pipe(
        tap(client => client.isAlive = false),
        tap(client => client.ping()),
        mapTo(ClientStatus.ALIVE),
      ),
    )),
  );

export const handleClientBrokenConnection = (client: MarbleWebSocketClient, scheduler?: SchedulerLike) =>
  merge(
    fromEvent(client, 'open'),
    fromEvent(client, 'ping'),
    fromEvent(client, 'pong'),
  ).pipe(
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
