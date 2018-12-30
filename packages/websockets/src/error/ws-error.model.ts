import { WebSocketStatus, WebSocketEvent } from '../websocket.interface';

class ExtendableError extends Error {
  constructor(public name: string, message: string) {
    super(message);
  }
}

export class WebSocketError extends ExtendableError {
  constructor(
    public readonly event: WebSocketEvent,
    public readonly message: string,
    public readonly data?: object,
  ) {
    super('WebSocketError', message);
  }
}

export class WebSocketConnectionError extends ExtendableError {
  constructor(
    public readonly message: string,
    public readonly status: WebSocketStatus | number,
  ) {
    super('WebSocketConnectionError', message);
  }
}
