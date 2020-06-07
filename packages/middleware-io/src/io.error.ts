import { NamedError } from '@marblejs/core/dist/+internal/utils';

export enum ErrorType {
  IO_ERROR = 'IOError',
}

export class IOError extends NamedError {
  constructor(
    public readonly message: string,
    public readonly data: Record<string, unknown> | Array<any>,
    public readonly context?: string,
  ) {
    super(ErrorType.IO_ERROR, message);
  }
}

export const isIOError = (error: Error): error is IOError =>
  error.name === ErrorType.IO_ERROR;
