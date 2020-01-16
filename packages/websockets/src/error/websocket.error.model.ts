import { ExtendableError } from '@marblejs/core/dist/+internal/utils';
import { WebSocketStatus } from '../websocket.interface';

export class WebSocketConnectionError extends ExtendableError {
  constructor(
    public readonly message: string,
    public readonly status: WebSocketStatus | number,
  ) {
    super('WebSocketConnectionError', message);
  }
}
