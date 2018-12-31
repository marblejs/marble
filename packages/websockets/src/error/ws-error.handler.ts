import { of } from 'rxjs';
import { MarbleWebSocketClient } from '../websocket.interface';
import { WebSocketErrorEffect } from '../effects/ws-effects.interface';
import { WebSocketError } from './ws-error.model';

export const handleEffectsError = <IncomingError extends WebSocketError>(
  client: MarbleWebSocketClient,
  error$: WebSocketErrorEffect<IncomingError, any, any> | undefined,
) => (error: IncomingError) => {
  if (error$) {
    error$(of(error.event), client, error).subscribe(client.sendResponse);
  }
};
