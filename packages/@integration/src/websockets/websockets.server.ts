import {
  WsEffect,
  WsMiddlewareEffect,
  WsConnectionEffect,
  WebSocketConnectionError,
  webSocketListener,
} from '@marblejs/websockets';
import { iif, throwError, of } from 'rxjs';
import { tap, mergeMap, buffer, map } from 'rxjs/operators';
import { matchEvent, use } from '@marblejs/core';
import { eventValidator$, t } from '../../../middleware-io/dist';

const sum$: WsEffect = event$ =>
  event$.pipe(
    matchEvent('SUM')
  );

const add$: WsEffect = (event$, ...args) =>
  event$.pipe(
    matchEvent('ADD'),
    use(eventValidator$(t.number)),
    buffer(sum$(event$, ...args)),
    map(addEvents => addEvents.reduce((a, e) => e.payload + a, 0)),
    map(payload => ({ type: 'SUM_RESULT', payload })),
  );

const logger$: WsMiddlewareEffect = event$ =>
  event$.pipe(
    tap(e => console.log(`type: ${e.type}, payload: ${e.payload}`)),
  );

const connection$: WsConnectionEffect = req$ =>
  req$.pipe(
    mergeMap(req => iif(
      () => req.headers.upgrade !== 'websocket',
      throwError(new WebSocketConnectionError('Unauthorized', 4000)),
      of(req),
    )),
  );

export const websocketsServer = webSocketListener({
  middlewares: [logger$],
  effects: [add$],
  connection$,
})();
