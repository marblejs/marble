import { of } from 'rxjs';
import { EventError, EffectContext } from '@marblejs/core';
import { MarbleWebSocketClient } from '../websocket.interface';
import { WsErrorEffect } from '../effects/websocket.effects.interface';

export const handleEffectsError = <IncomingError extends EventError>(
  ctx: EffectContext<MarbleWebSocketClient>,
  error$: WsErrorEffect<IncomingError, any, any> | undefined,
) => (error: IncomingError) => {
  if (error$) {
    const input$ = of({
      event: error.event,
      error,
    });

    error$(input$, ctx).subscribe(ctx.client.sendResponse);
  }
};
