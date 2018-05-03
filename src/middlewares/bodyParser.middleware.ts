import { Observable } from 'rxjs';
import { switchMap, tap, toArray, map } from 'rxjs/operators';
import { HttpRequest } from '../http.interface';
import { Effect } from '../effects/effects.interface';
import { ContentType } from '../util';

export const fromReadableStream = (stream: HttpRequest): Observable<any> => {
  stream.pause();
  return Observable.create(observer => {
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

export const bodyParser$: Effect<HttpRequest> = request$ => request$
  .pipe(
    switchMap(req =>
      req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
        ? request$.pipe(
            switchMap(getBody),
            tap(body => req.body = body),
            map(body => req)
          )
        : request$
    )
  );
