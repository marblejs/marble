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
  broadcast
} from '../../websockets/src';
import { map, buffer } from 'rxjs/operators';

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
    broadcast(client)(event => ({
      type: 'SUM_RESULT',
      payload: event,
    })),
    mapToAction((sum, c) => c
      .type('SUM_RESULT')
      .payload(sum)
    ),
  );

export const app = httpListener({
  middlewares: [
    loggerDev$,
    loggerFile$,
    bodyParser$,
  ],
  effects: [api$]
});

export const ws = webSocketListener({
  middlewares: [],
  effects: [add$],
});
