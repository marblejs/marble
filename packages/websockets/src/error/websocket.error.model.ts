import { NamedError } from '@marblejs/core/dist/+internal/utils';
import { WebSocketStatus } from '../websocket.interface';

export class WebSocketConnectionError extends NamedError {
  constructor(
    public readonly message: string,
    public readonly status: WebSocketStatus | number,
  ) {
    super('WebSocketConnectionError', message);
  }
}
