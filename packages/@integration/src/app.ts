import { httpListener } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { loggerDev$, loggerFile$ } from './middlewares/logger.middleware';
import { api$ } from './effects/api.effects';
import {
  webSocketListener,
  WebSocketEffect,
  WebSocketEvent,
  matchType,
  mapToAction,
  WebSocketConnectionError,
  WebSocketConnectionEffect,
} from '@marblejs/websockets';
import { iif, throwError, of } from 'rxjs';
import { map, buffer, mergeMap } from 'rxjs/operators';

const sum$: WebSocketEffect = event$ =>
  event$.pipe(
    matchType('SUM')
  );

const add$: WebSocketEffect = (event$, client) =>
  event$.pipe(
    matchType('ADD'),
    buffer(sum$(event$, client)),
    map(events => events as WebSocketEvent<number>[]),
    map(events => events.reduce((a, e) => e.payload + a, 0)),
    mapToAction((sum, c) => c
      .type('SUM_RESULT')
      .payload(sum)
    ),
  );

const connection$: WebSocketConnectionEffect = req$ =>
  req$.pipe(
    mergeMap(req => iif(
      () => req.headers.upgrade !== 'websocket',
      throwError(new WebSocketConnectionError('Unauthorized', 4000)),
      of(req),
    )),
  );

export const httpServer = httpListener({
  middlewares: [
    loggerDev$,
    loggerFile$,
    bodyParser$,
  ],
  effects: [api$]
});

export const webSocketServer = webSocketListener({
  middlewares: [],
  effects: [add$],
  connection: connection$,
});
