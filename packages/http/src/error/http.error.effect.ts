import { map } from 'rxjs/operators';
import { HttpErrorEffect } from '../effects/http.effects.interface';
import { HttpStatus } from '../http.interface';
import { HttpError, isHttpError } from './http.error.model';

interface HttpErrorResponse {
  error: {
    status: HttpStatus;
    message: string;
    data?: any;
    context?: string;
  };
}

const defaultHttpError = new HttpError(
  'Internal server error',
  HttpStatus.INTERNAL_SERVER_ERROR,
);

const getStatusCode = (error: Error): HttpStatus =>
  isHttpError(error)
    ? error.status
    : HttpStatus.INTERNAL_SERVER_ERROR;

const errorFactory = (status: HttpStatus) => (error: Error): HttpErrorResponse => ({
  error: isHttpError(error)
    ? { status, message: error.message, data: error.data, context: error.context }
    : { status, message: error.message },
});

export const defaultError$: HttpErrorEffect = req$ =>
  req$.pipe(
    map(({ request, error = defaultHttpError }) => {
      const status = getStatusCode(error);
      const body = errorFactory(status)(error);
      return ({ status, body, request });
    }),
  );
