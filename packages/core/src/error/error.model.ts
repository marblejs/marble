import { HttpStatus } from '../http.interface';

export class ExtendableError extends Error {
  constructor(public name: string, message: string) {
    super(message);
  }
}

export class HttpError extends ExtendableError {
  constructor(
    public readonly message: string,
    public readonly status: HttpStatus,
    public readonly data?: object,
  ) {
    super('HttpError', message);
  }
}

export class CoreError extends ExtendableError {
  constructor(
    public readonly message: string,
    options: {
      stackTraceFactory: (message: string, stack: NodeJS.CallSite[]) => string,
      context: any,
    }
  ) {
    super('CoreError', message);

    Error.prepareStackTrace = (_, stack) => options.stackTraceFactory(message, stack);
    Error.captureStackTrace(this, options.context);
  }
}

export const isHttpError = (error: Error): error is HttpError =>
  error.name === 'HttpError';
