import { Event } from '../event/event.interface';
import { HttpStatus } from '../http/http.interface';
import { ExtendableError } from '../+internal/utils';

export enum ErrorType {
  CORE_ERROR = 'CoreError',
  CONTEXT_ERROR = 'ContextError',
  HTTP_ERROR = 'HttpError',
  EVENT_ERROR = 'EventError',
}

export class HttpError extends ExtendableError {
  constructor(
    public readonly message: string,
    public readonly status: HttpStatus,
    public readonly data?: object,
    public readonly context?: string,
  ) {
    super(ErrorType.HTTP_ERROR, message);
  }
}

export class CoreError extends ExtendableError {
  constructor(
    public readonly message: string,
    options: {
      stackTraceFactory: (message: string, stack: NodeJS.CallSite[]) => string;
      context: any;
    }
  ) {
    super(ErrorType.CORE_ERROR, message);
    Error.prepareStackTrace = (_, stack) => options.stackTraceFactory(message, stack);
    Error.captureStackTrace(this, options.context);
  }
}

export class ContextError extends ExtendableError {
  constructor(
    public readonly message: string,
  ) {
    super(ErrorType.CONTEXT_ERROR, message);
  }
}

export class EventError extends ExtendableError {
  constructor(
    public readonly event: Event,
    public readonly message: string,
    public readonly data?: object,
  ) {
    super(ErrorType.EVENT_ERROR, message);
  }
}

export const isHttpError = (error: Error): error is HttpError =>
  error.name === ErrorType.HTTP_ERROR;

export const isCoreError = (error: Error): error is CoreError =>
  error.name === ErrorType.CORE_ERROR;

export const isEventError = (error: Error): error is EventError =>
  error.name === ErrorType.EVENT_ERROR;
