import { ContentType, HttpError, HttpRequest, HttpStatus, Middleware } from '@marblejs/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap, toArray, mapTo } from 'rxjs/operators';
import { serializeUrlEncoded } from './urlEncoded.serializer';

const PARSEABLE_METHODS = ['POST', 'PUT', 'PATCH'];

const fromReadableStream = (stream: HttpRequest): Observable<any> => {
  stream.pause();
  return new Observable(observer => {
    const next = chunk => observer.next(chunk);
    const complete = () => observer.complete();
    const error = err => observer.error(err);

    stream
      .on('data', next)
      .on('error', error)
      .on('end', complete)
      .resume();

    return () => {
      stream.removeListener('data', next);
      stream.removeListener('error', error);
      stream.removeListener('end', complete);
    };
  });
};

const getBody = (req: HttpRequest) =>
  fromReadableStream(req).pipe(
    toArray(),
    map(chunks => Buffer.concat(chunks)),
    map(buffer => buffer.toString()),
    map(body => {
      switch (req.headers['content-type']) {
        case ContentType.APPLICATION_JSON:
          return JSON.parse(body);
        case ContentType.APPLICATION_X_WWW_FORM_URLENCODED:
          return serializeUrlEncoded(decodeURIComponent(body));
        default:
          return body;
      }
    })
  );

export const bodyParser$: Middleware = req$ =>
  req$.pipe(
    switchMap(req =>
      PARSEABLE_METHODS.includes(req.method)
        ? of(req).pipe(
            switchMap(getBody),
            tap(body => (req.body = body)),
            mapTo(req),
            catchError(() => throwError(new HttpError('Request body parse error', HttpStatus.BAD_REQUEST)))
          )
        : of(req)
    )
  );
