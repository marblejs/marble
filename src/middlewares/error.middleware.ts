import { map } from 'rxjs/operators';
import { Effect, EffectResponse } from '../effects/effects.interface';
import { HttpStatus } from '../http.interface';
import { HttpError, isHttpError } from '../util/error.util';

export type Error = HttpError;

export const getErrorMiddleware = (customError$?: Effect<EffectResponse, Error>) => !!customError$
  ? customError$
  : error$;

export const getStatusCode = (error: Error): HttpStatus => isHttpError(error)
  ? error.status
  : HttpStatus.INTERNAL_SERVER_ERROR;

export const errorFactory = (message: string, status: HttpStatus, data?: any) => ({
  error: { status, message, data }
});

export const error$: Effect<EffectResponse, Error> = (request$, response, error) => request$
  .pipe(
    map(req => {
      const { message } = error;
      const status = getStatusCode(error);
      const body = errorFactory(message, status);

      return { status, body };
    }),
  );
