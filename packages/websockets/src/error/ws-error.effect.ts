import { map } from 'rxjs/operators';
import { WebSocketError } from './ws-error.model';
import { WebSocketErrorEffect } from '../effects/ws-effects.interface';
import { WebSocketType } from '../websocket.interface';

const errorFactory = (eventType: WebSocketType, message: string, data: any | undefined) => ({
  error: { eventType, message, data },
});

export const defaultError$: WebSocketErrorEffect<WebSocketError> = (event$, _, error) => event$
  .pipe(
    map(({ type }) => ({
      type,
      payload: errorFactory(
        type,
        error ? error.message : '',
        error ? error.data : undefined,
      )
    })),
  );
