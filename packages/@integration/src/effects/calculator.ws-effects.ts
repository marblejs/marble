import { WebSocketEffect, matchType, WebSocketEvent } from '@marblejs/websockets';
import { buffer, map } from 'rxjs/operators';

export const sum$: WebSocketEffect = event$ =>
  event$.pipe(
    matchType('SUM')
  );

export const add$: WebSocketEffect = (event$, client) =>
  event$.pipe(
    matchType('ADD'),
    buffer(sum$(event$, client)),
    map(events => events as WebSocketEvent<number>[]),
    map(events => events.reduce((a, e) => e.payload! + a, 0)),
    map(payload => ({ type: 'SUM_RESULT', payload })),
  );
