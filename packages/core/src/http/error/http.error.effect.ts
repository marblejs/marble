import { map } from 'rxjs/operators';
import { HttpError, isHttpError } from '../../error/error.model';
import { HttpErrorEffect } from '../effects/http.effects.interface';
import { HttpStatus } from '../http.interface';

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

export const defaultError$: HttpErrorEffect<Error> = req$ =>
  req$.pipe(
    map(({ error = defaultHttpError }) => {
      const status = getStatusCode(error);
      const body = errorFactory(status, error);
      return { status, body };
    }),
  );
