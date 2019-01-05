import { ExtendableError } from '@marblejs/core/dist/+internal/utils';

export enum ErrorType {
  IO_ERROR = 'IOError',
}

export class IOError extends ExtendableError {
  constructor(
    public readonly message: string,
    public readonly data: object,
  ) {
    super(ErrorType.IO_ERROR, message);
  }
}

export const isIOError = (error: Error): error is IOError =>
  error.name === ErrorType.IO_ERROR;
