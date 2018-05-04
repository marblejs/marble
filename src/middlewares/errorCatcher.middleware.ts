import { tap } from 'rxjs/operators';
import { Effect } from '../effects';
import { HttpRequest } from '../http.interface';
import { DEFAULT_HEADERS } from '../response';
import { StatusCode } from '../util';
import { HttpError, isHttpError } from '../util/error.util';

export type Error = HttpError;

export const getErrorMiddleware = (customErrorCatcher$?: Effect<HttpRequest, Error>) => !!customErrorCatcher$
  ? customErrorCatcher$
  : errorCatcher$;

export const getStatusCode = (error: Error): StatusCode => isHttpError(error)
  ? error.status
  : StatusCode.INTERNAL_SERVER_ERROR;

export const errorFactory = (message: string, status: StatusCode, data?: any) => ({
  error: { status, message, data }
});

export const errorCatcher$: Effect<HttpRequest, Error> = (request$, response, error) => request$
  .pipe(
    tap(req => {
      const { message } = error;
      const status = getStatusCode(error);
      const errorObject = errorFactory(message, status);

      response.writeHead(status, DEFAULT_HEADERS);
      response.end(JSON.stringify(errorObject));
    })
  );
