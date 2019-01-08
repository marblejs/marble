import { of } from 'rxjs';
import { EventError } from '@marblejs/core';
import { MarbleWebSocketClient } from '../websocket.interface';
import { WebSocketErrorEffect } from '../effects/ws-effects.interface';

export const handleEffectsError = <IncomingError extends EventError>(
  client: MarbleWebSocketClient,
  error$: WebSocketErrorEffect<IncomingError, any, any> | undefined,
) => (error: IncomingError) => {
  if (error$) {
    error$(of(error.event), client, error).subscribe(client.sendResponse);
  }
};
