import { use } from '@marblejs/core';
import { WebSocketEffect, matchType } from '@marblejs/websockets';
import { io, eventValidator$ } from '@marblejs/middleware-io';
import { buffer, map } from 'rxjs/operators';

const validator = io.type({
  payload: io.number,
});

export const sum$: WebSocketEffect = event$ =>
  event$.pipe(
    matchType('SUM')
  );

export const add$: WebSocketEffect = (event$, client) =>
  event$.pipe(
    matchType('ADD'),
    use(eventValidator$(validator)),
    buffer(sum$(event$, client)),
    map(events => events.reduce((a, e) => e.payload! + a, 0)),
    map(payload => ({ type: 'SUM_RESULT', payload })),
  );
