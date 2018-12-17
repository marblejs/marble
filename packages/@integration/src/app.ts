import { httpListener } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { loggerDev$, loggerFile$ } from './middlewares/logger.middleware';
import { api$ } from './effects/api.effects';
import { webSocketListener, WebSocketEffect } from '../../websockets/src';
import { map, filter, buffer } from 'rxjs/operators';

const sum$: WebSocketEffect = event$ =>
  event$.pipe(
    filter(event => event.type === 'SUM'),
  );

const add$: WebSocketEffect = event$ =>
  event$.pipe(
    filter(event => event.type === 'ADD'),
    buffer(sum$(event$)),
    map(events => events.reduce((a, e) => e.payload as number + a, 0)),
    map(sum => ({ type: 'SUM_RESULT', payload: sum }))
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
