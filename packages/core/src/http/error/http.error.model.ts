import { HttpStatus, HttpRequest } from '../http.interface';
import { ExtendableError } from '../../+internal/utils';

export enum HttpErrorType {
  HTTP_ERROR = 'HttpError',
  HTTP_EFFECT_ERROR = 'HttpEffectError',
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

export class HttpEffectError extends ExtendableError {
  constructor(
    public readonly error: Error,
    public readonly request: HttpRequest,
  ) {
    super(HttpErrorType.HTTP_EFFECT_ERROR, 'An error occured in HttpEffect');
  }
}

export const isHttpError = (error: Error): error is HttpError =>
  error.name === HttpErrorType.HTTP_ERROR;
