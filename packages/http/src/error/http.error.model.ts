import * as chalk from 'chalk';
import { CoreError, coreErrorFactory } from '@marblejs/core';
import { isString, NamedError } from '@marblejs/core/dist/+internal/utils';
import { HttpStatus, HttpRequest } from '../http.interface';
import { HttpEffectResponse } from '../effects/http.effects.interface';

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

export const isURIError = (error: any): error is URIError =>
  error?.name === 'URIError';

export const unexpectedErrorWhileSendingResponseFactory = (error: Error): CoreError => {
  const message = `An unexpected error ${chalk.red(`"${error.message}"`)} occured while sending a response. Please check your output/error effect.`;
  return coreErrorFactory(message, { printStacktrace: false });
};

export const responseNotBoundToRequestErrorFactory = (response: HttpEffectResponse): CoreError => {
  const message = `An effect returned a response: "${chalk.yellow(JSON.stringify(response))}" without bound request`;
  return coreErrorFactory(message, { printStacktrace: false });
};

export const errorNotBoundToRequestErrorFactory = (error: Error): CoreError => {
  const message = `An effect or middleware thrown an error ${chalk.red(`"${error.message}"`)} without bound request.`;
  return coreErrorFactory(message, { printStacktrace: false });
};

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : isString(error)
      ? error
      : JSON.stringify(error);
