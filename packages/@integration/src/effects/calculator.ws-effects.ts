import { use, matchEvent } from '@marblejs/core';
import { WebSocketEffect } from '@marblejs/websockets';
import { t, eventValidator$ } from '@marblejs/middleware-io';
import { buffer, map } from 'rxjs/operators';

export const sum$: WebSocketEffect = event$ =>
  event$.pipe(
    matchEvent('SUM')
  );

export const add$: WebSocketEffect = (event$, ...args) =>
  event$.pipe(
    matchEvent('ADD'),
    use(eventValidator$(t.number)),
    buffer(sum$(event$, ...args)),
    map(events => events.reduce((a, e) => e.payload! + a, 0)),
    map(payload => ({ type: 'SUM_RESULT', payload })),
  );
