import { WebSocketEffect, matchType, WebSocketEvent, mapToAction } from '@marblejs/websockets';
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
    mapToAction((sum, c) => c
      .type('SUM_RESULT')
      .payload(sum)
    ),
  );
