import { map } from 'rxjs/operators';
import { Effect, EffectResponse } from '../effects/effects.interface';
import { HttpStatus } from '../http.interface';
import { HttpError, isHttpError } from '../util/error.util';

export type ThrowedError = HttpError | Error;

export const getErrorMiddleware = (customError$?: Effect<EffectResponse, ThrowedError>) => !!customError$
  ? customError$
  : error$;

const getStatusCode = (error: ThrowedError): HttpStatus => isHttpError(error)
  ? error.status
  : HttpStatus.INTERNAL_SERVER_ERROR;

const errorFactory = (message: string, status: HttpStatus, data?: any) => ({
  error: { status, message, data }
});

export const error$: Effect<EffectResponse, ThrowedError> = (request$, response, error) => request$
  .pipe(
    map(req => {
      const { message } = error;
      const status = getStatusCode(error);
      const body = errorFactory(message, status);

      return { status, body };
    }),
  );
