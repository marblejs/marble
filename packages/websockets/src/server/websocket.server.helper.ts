import * as WebSocket from 'ws';
import { EMPTY, fromEvent, merge, SchedulerLike, throwError, interval, from, iif, of } from 'rxjs';
import { takeUntil, catchError, tap, mapTo, timeout, map, mergeMap, mergeMapTo } from 'rxjs/operators';
import { Context, lookup } from '@marblejs/core';
import { WebSocketStatus, WebSocketConnectionLiveness } from '../websocket.interface';
import { WebSocketConnectionError } from '../error/websocket.error.model';
import { EventTransformer } from '../transformer/websocket.transformer.interface';
import { broadcastEvent } from './websocket.server.response';
import { WebSocketServerConnection, WebSocketClientConnection } from './websocket.server.interface';

export const HEART_BEAT_INTERVAL = 10 * 1000;
export const HEART_BEAT_TERMINATE_INTERVAL = HEART_BEAT_INTERVAL + 1000;

export const createServer = (options: WebSocket.ServerOptions, eventTransformer: EventTransformer<any>, ctx: Context) => {
  const ask = lookup(ctx);
  const server = new WebSocket.Server(options) as WebSocketServerConnection;
  server.sendBroadcastResponse = broadcastEvent({ server, eventTransformer, ask });
  return server;
}

export const sendMessage = (client: WebSocket) => (outgoingEvent: any): Promise<unknown> =>
  new Promise((res, rej) => client.send(outgoingEvent, err => err ? rej() : res(undefined)));

export const handleServerBrokenConnections = (server: WebSocketServerConnection, scheduler?: SchedulerLike) =>
  interval(HEART_BEAT_INTERVAL, scheduler).pipe(
    takeUntil(fromEvent(server, 'close')),
    mergeMapTo(from(server.clients)),
    map(client => client as WebSocketClientConnection),
    mergeMap(client => iif(
      () => !client.isAlive,
      of(client).pipe(
        tap(client => client.isAlive = false),
        tap(() => client.terminate()),
        mapTo(WebSocketConnectionLiveness.DEAD),
      ),
      of(client).pipe(
        tap(client => client.isAlive = false),
        tap(client => client.ping()),
        mapTo(WebSocketConnectionLiveness.ALIVE),
      ),
    )),
  );

export const handleClientBrokenConnection = (client: WebSocketClientConnection, scheduler?: SchedulerLike) =>
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

export const handleClientValidationError = (client: WebSocketClientConnection) => (error: WebSocketConnectionError) => {
  client.isAlive = false;
  client.close(error.status || WebSocketStatus.INTERNAL_ERROR, error.message);
  return EMPTY;
};
