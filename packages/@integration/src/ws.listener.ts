import { webSocketListener, WebSocketConnectionError, WsConnectionEffect } from '@marblejs/websockets';
import { iif, throwError, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { add$ } from './effects/calculator.ws-effects';
import { logger$ } from './middlewares/logger.ws-middleware';

const connection$: WsConnectionEffect = req$ =>
  req$.pipe(
    mergeMap(req => iif(
      () => req.headers.upgrade !== 'websocket',
      throwError(new WebSocketConnectionError('Unauthorized', 4000)),
      of(req),
    )),
  );

export const webSocketServer = webSocketListener({
  middlewares: [logger$],
  effects: [add$],
  connection$,
});
