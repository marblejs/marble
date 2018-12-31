import { of } from 'rxjs';
import { MarbleWebSocketClient } from '../websocket.interface';
import { WebSocketErrorEffect } from '../effects/ws-effects.interface';
import { WebSocketError } from './ws-error.model';

export const handleEffectsError = <IncomingError extends WebSocketError>(
  extendedClient: MarbleWebSocketClient,
  errorEffect: WebSocketErrorEffect<IncomingError, any, any> | undefined,
) => (error: IncomingError) => {
  if (errorEffect) {
    errorEffect(of(error.event), extendedClient, error).subscribe(extendedClient.sendResponse);
  }
};
