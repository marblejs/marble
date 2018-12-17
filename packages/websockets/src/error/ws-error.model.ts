export class ExtendableError extends Error {
  constructor(public name: string, message: string) {
    super(message);
  }
}

export class WebSocketError extends ExtendableError {
  constructor(
    public readonly message: string,
    public readonly data?: object,
  ) {
    super('WebSocketError', message);
  }
}
