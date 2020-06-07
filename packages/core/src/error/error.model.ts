import { Event } from '../event/event.interface';
import { NamedError } from '../+internal/utils';

export enum ErrorType {
  CORE_ERROR = 'CoreError',
  CONTEXT_ERROR = 'ContextError',
  EVENT_ERROR = 'EventError',
}

export class CoreError extends NamedError {
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

export class ContextError extends NamedError {
  constructor(
    public readonly message: string,
  ) {
    super(ErrorType.CONTEXT_ERROR, message);
  }
}

export class EventError extends NamedError {
  constructor(
    public readonly event: Event,
    public readonly message: string,
    public readonly data?: Record<string, unknown> | Array<any>,
  ) {
    super(ErrorType.EVENT_ERROR, message);
  }
}

export const isCoreError = (error: Error | undefined): error is CoreError =>
  error?.name === ErrorType.CORE_ERROR;

export const isEventError = (error: Error | undefined): error is EventError =>
  error?.name === ErrorType.EVENT_ERROR;
