import * as chalk from 'chalk';
import { HttpStatus, HttpRequest } from '../http.interface';
import { NamedError } from '../../+internal/utils';
import { HttpEffectResponse } from '../effects/http.effects.interface';
import { coreErrorFactory } from '../../error/error.factory';

export enum HttpErrorType {
  HTTP_ERROR = 'HttpError',
  HTTP_REQUEST_ERROR = 'HttpRequestError',
}

export class HttpError extends NamedError {
  constructor(
    public readonly message: string,
    public readonly status: HttpStatus,
    public readonly data?: Record<string, unknown> | Array<any>,
    public readonly request?: HttpRequest,
    public readonly context?: string,
  ) {
    super(HttpErrorType.HTTP_ERROR, message);
  }
}

export class HttpRequestError extends NamedError {
  constructor(
    public readonly request: HttpRequest,
    public readonly error: Error,
  ) {
    super(HttpErrorType.HTTP_REQUEST_ERROR, 'An error occured while processing a request');
  }
}

export const isHttpError = (error: Error | undefined): error is HttpError =>
  error?.name === HttpErrorType.HTTP_ERROR;

export const isHttpRequestError = (error: Error | undefined): error is HttpRequestError =>
  error?.name === HttpErrorType.HTTP_REQUEST_ERROR;

export const unexpectedErrorWhileSendingErrorFactory = (error: Error) => {
  const message = `An unexpected error ${chalk.red(`"${error.message}"`)} occured while sending an error response. Please check your error effect.`;
  return coreErrorFactory(message, { printStacktrace: false });
}

export const unexpectedErrorWhileSendingOutputFactory = (error: Error) => {
  const message = `An unexpected error ${chalk.red(`"${error.message}"`)} occured while sending a response. Please check your output effect.`;
  return coreErrorFactory(message, { printStacktrace: false });
}

export const responseNotBoundToRequestErrorFactory = (response: HttpEffectResponse) => {
  const message = `An effect returned a response: "${chalk.yellow(JSON.stringify(response))}" without bound request`;
  return coreErrorFactory(message, { printStacktrace: false });
}

export const errorNotBoundToRequestErrorFactory = (error: Error) => {
  const message = `An effect or middleware thrown an error ${chalk.red(`"${error.message}"`)} without bound request.`;
  return coreErrorFactory(message, { printStacktrace: false });
}
