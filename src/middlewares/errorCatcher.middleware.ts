import { tap } from 'rxjs/operators';
import { Effect } from '../effects';
import { HttpRequest } from '../http.interface';
import { DEFAULT_HEADERS } from '../response';
import { StatusCode } from '../util';
import { HttpError, ServerError, isHttpError, isServerError } from '../util/error.util';

export type Error = HttpError | ServerError;

export const getStatusCode = (error: Error): StatusCode => {
  if (isServerError(error)) {
    return StatusCode.BAD_REQUEST;
  }

  if (isHttpError(error)) {
    return error.status;
  }

  return StatusCode.INTERNAL_SERVER_ERROR;
};

export const errorCatcher$: Effect<HttpRequest, Error> = (request$, response, error) => request$
  .pipe(
    tap(req => {
      const status = getStatusCode(error);
      const errorObject = {
        error: {
          status,
          message: error.message,
        },
      };

      response.writeHead(status, DEFAULT_HEADERS);
      response.end(JSON.stringify(errorObject));
    })
  );
