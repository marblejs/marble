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

export const isHttpError = (error: Error): error is HttpError =>
  error.name === 'HttpError';
