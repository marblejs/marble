import { from, merge } from 'rxjs';
import { concatMap, last } from 'rxjs/operators';
import { WebSocketMiddleware, WebSocketEffect } from './ws-effects.interface';

export const combineMiddlewares =
  (middlewares: WebSocketMiddleware[] = []): WebSocketMiddleware =>
  (event$, client, meta) =>
    middlewares.length
      ? from(middlewares).pipe(
          concatMap(middleware => middleware(event$, client, meta)),
          last(),
        )
      : event$;

export const combineWebSocketEffects =
  (effects: WebSocketEffect[] = []): WebSocketEffect =>
  (event$, client, meta) =>
    merge(...effects.map(effect => effect(event$, client, meta)));
