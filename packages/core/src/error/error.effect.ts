import { map } from 'rxjs/operators';
import { ErrorEffect } from '../effects/effects.interface';
import { HttpStatus } from '../http.interface';
import { HttpError, isHttpError } from './error.model';

const defaultHttpError = new HttpError(
  'Internal server error',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

const getStatusCode = (error: Error): HttpStatus =>
  isHttpError(error)
    ? error.status
    : HttpStatus.INTERNAL_SERVER_ERROR;

const errorFactory = (status: HttpStatus, error: Error) =>
  isHttpError(error)
    ? { error: { status, message: error.message, data: error.data, context: error.context } }
    : { error: { status, message: error.message } };

export const defaultError$: ErrorEffect<HttpError> = (req$, _, error = defaultHttpError) => req$
  .pipe(
    map(() => {
      const status = getStatusCode(error);
      const body = errorFactory(status, error);
      return { status, body };
    }),
  );
