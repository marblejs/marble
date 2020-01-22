import {
  WsEffect,
  WsConnectionEffect,
  WebSocketConnectionError,
  webSocketListener,
  createWebSocketServer,
} from '@marblejs/websockets';
import { iif, throwError, of } from 'rxjs';
import { mergeMap, buffer, map } from 'rxjs/operators';
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

const error$: WsEffect = event$ =>
  event$.pipe(
    matchEvent('ERROR'),
    mergeMap(() => throwError(new Error('some_error_message'))),
  );

const connection$: WsConnectionEffect = req$ =>
  req$.pipe(
    mergeMap(req => iif(
      () => req.headers.upgrade !== 'websocket',
      throwError(new WebSocketConnectionError('Unauthorized', 4000)),
      of(req),
    )),
  );

export const webSocketServer = createWebSocketServer({
  connection$,
  webSocketListener: webSocketListener({
    middlewares: [],
    effects: [add$, error$],
  }),
});
