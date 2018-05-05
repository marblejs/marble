import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, tap, toArray } from 'rxjs/operators';
import { Effect } from '../effects/effects.interface';
import { HttpRequest, HttpStatus } from '../http.interface';
import { ContentType } from '../util/contentType.util';
import { HttpError } from '../util/error.util';

export const fromReadableStream = (stream: HttpRequest): Observable<any> => {
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

export const getBody = (req: HttpRequest) =>
  fromReadableStream(req)
    .pipe(
      toArray(),
      map(chunks => Buffer.concat(chunks)),
      map(buffer => buffer.toString()),
      map(body => {
        switch (req.headers['content-type']) {
          case ContentType.APPLICATION_JSON:
            return JSON.parse(body);
          default:
            return body;
        }
      }),
    );

export const bodyParser$: Effect<HttpRequest> = (request$, response) => request$
  .pipe(
    switchMap(req =>
      req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
        ? request$.pipe(
            switchMap(getBody),
            tap(body => req.body = body),
            map(body => req),
            catchError(error => throwError(new HttpError('Request body parse error', HttpStatus.BAD_REQUEST)))
          )
        : request$
    )
  );
