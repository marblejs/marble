import { use, matchEvent } from '@marblejs/core';
import { WsEffect } from '@marblejs/websockets';
import { t, eventValidator$ } from '@marblejs/middleware-io';
import { buffer, map } from 'rxjs/operators';

export const sum$: WsEffect = event$ =>
  event$.pipe(
    matchEvent('SUM')
  );

export const add$: WsEffect = (event$, ...args) =>
  event$.pipe(
    matchEvent('ADD'),
    use(eventValidator$(t.number)),
    buffer(sum$(event$, ...args)),
    map(addEvents => addEvents.reduce((a, e) => e.payload + a, 0)),
    map(payload => ({ type: 'SUM_RESULT', payload })),
  );
