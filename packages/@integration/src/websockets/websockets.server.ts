import { WsEffect, webSocketListener, createWebSocketServer } from '@marblejs/websockets';
import { buffer, map } from 'rxjs/operators';
import { matchEvent, use } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';

const sum$: WsEffect = event$ =>
  event$.pipe(
    matchEvent('SUM')
  );

const add$: WsEffect = (event$, ctx) =>
  event$.pipe(
    matchEvent('ADD'),
    use(eventValidator$(t.number)),
    buffer(sum$(event$, ctx)),
    map(addEvents => addEvents.reduce((a, e) => e.payload + a, 0)),
    map(payload => ({ type: 'SUM_RESULT', payload })),
  );

export const webSocketServer = createWebSocketServer({
  listener: webSocketListener({
    middlewares: [],
    effects: [add$],
  }),
});
