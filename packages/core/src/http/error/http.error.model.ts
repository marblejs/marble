import { HttpStatus } from '../http.interface';
import { ExtendableError } from '../../+internal/utils';

export enum HttpErrorType {
  HTTP_ERROR = 'HttpError',
}

export class HttpError extends ExtendableError {
  constructor(
    public readonly message: string,
    public readonly status: HttpStatus,
    public readonly data?: object,
    public readonly context?: string,
  ) {
    super(HttpErrorType.HTTP_ERROR, message);
  }
}

export const isHttpError = (error: Error): error is HttpError =>
  error.name === HttpErrorType.HTTP_ERROR;
