import { Observable, EMPTY } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MarbleWebSocketClient } from '../websocket.interface';
import { WebSocketErrorEffect } from '../effects/ws-effects.interface';

export const errorHandler = <T, IncomingError extends Error>(
  event$: Observable<T>,
  extendedClient: MarbleWebSocketClient,
  errorEffect: WebSocketErrorEffect<IncomingError, any, any> | undefined,
) => (error: IncomingError) =>
  errorEffect
    ? errorEffect(event$, extendedClient, error).pipe(
        tap(extendedClient.sendResponse)
      )
    : EMPTY;
