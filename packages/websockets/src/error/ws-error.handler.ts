import { of } from 'rxjs';
import { EventError, EffectMetadata } from '@marblejs/core';
import { MarbleWebSocketClient } from '../websocket.interface';
import { WsErrorEffect } from '../effects/ws-effects.interface';

export const handleEffectsError = <IncomingError extends EventError>(
  metadata: EffectMetadata,
  client: MarbleWebSocketClient,
  error$: WsErrorEffect<IncomingError, any, any> | undefined,
) => (error: IncomingError) => {
  if (error$) {
    const input$ = of({
      event: error.event,
      error,
    });

    error$(input$, client, metadata).subscribe(client.sendResponse);
  }
};
