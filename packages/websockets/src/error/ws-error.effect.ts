import { EventError } from '@marblejs/core';
import { map } from 'rxjs/operators';
import { WebSocketErrorEffect } from '../effects/ws-effects.interface';

const DEFAULT_ERROR_CHANNEL = 'ERROR';

const errorFactory = (message: string | undefined, data: any | undefined) => ({
  message, data,
});

export const error$: WebSocketErrorEffect<EventError> = (event$, _, error) =>
  event$.pipe(
    map(event => ({
      type: event ? event.type : DEFAULT_ERROR_CHANNEL,
      error: errorFactory(
        error ? error.message : undefined,
        error ? error.data : undefined,
      )
    })),
  );
