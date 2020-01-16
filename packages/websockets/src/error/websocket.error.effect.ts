import { map } from 'rxjs/operators';
import { Event, isEventError, EventError } from '@marblejs/core';
import { WsErrorEffect } from '../effects/websocket.effects.interface';

const mapError = (error: Error | undefined): Event => ({
  type: 'UNHANDLED_ERROR',
  error: {
    name: error?.name,
    message: error?.message,
  },
});

const mapEventError = (error: EventError): Event => ({
  type: error.event.type,
  error: {
    name: error.name,
    message: error.message,
    data: error.data,
  },
});

export const defaultError$: WsErrorEffect = event$ =>
  event$.pipe(
    map(error => error && isEventError(error)
      ? mapEventError(error)
      : mapError(error)),
  );
