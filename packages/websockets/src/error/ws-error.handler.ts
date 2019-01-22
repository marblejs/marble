import { of } from 'rxjs';
import { EventError, EffectMetadata } from '@marblejs/core';
import { MarbleWebSocketClient } from '../websocket.interface';
import { WebSocketErrorEffect } from '../effects/ws-effects.interface';

export const handleEffectsError = <IncomingError extends EventError>(
  metadata: EffectMetadata,
  client: MarbleWebSocketClient,
  error$: WebSocketErrorEffect<IncomingError, any, any> | undefined,
) => (error: IncomingError) => {
  if (error$) {
    error$(of(error.event), client, { ...metadata, error }).subscribe(client.sendResponse);
  }
};
