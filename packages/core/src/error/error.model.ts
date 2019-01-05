import { HttpStatus } from '../http.interface';
import { ExtendableError } from '../+internal/utils';

export enum ErrorType {
  CORE_ERROR = 'CoreError',
  HTTP_ERROR = 'HttpError',
}

export class HttpError extends ExtendableError {
  constructor(
    public readonly message: string,
    public readonly status: HttpStatus,
    public readonly data?: object,
  ) {
    super(ErrorType.HTTP_ERROR, message);
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
    super(ErrorType.CORE_ERROR, message);
    Error.prepareStackTrace = (_, stack) => options.stackTraceFactory(message, stack);
    Error.captureStackTrace(this, options.context);
  }
}

export const isHttpError = (error: Error): error is HttpError =>
  error.name === ErrorType.HTTP_ERROR;

export const isCoreError = (error: Error): error is CoreError =>
  error.name === ErrorType.CORE_ERROR;
