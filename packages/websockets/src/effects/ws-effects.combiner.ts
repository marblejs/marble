import { from } from 'rxjs';
import { concatMap, last } from 'rxjs/operators';
import { WebSocketMiddleware } from './ws-effects.interface';

export const combineWebSocketMiddlewares =
  (middlewares: WebSocketMiddleware[] = []): WebSocketMiddleware =>
  (event$, client, meta) =>
    middlewares.length
      ? from(middlewares).pipe(
          concatMap(middleware => middleware(event$, client, meta)),
          last(),
        )
      : event$;
