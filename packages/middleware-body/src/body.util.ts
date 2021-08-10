import * as typeIs from 'type-is';
import { pipe } from 'fp-ts/lib/function';
import { Observable } from 'rxjs';
import { map, toArray } from 'rxjs/operators';
import { HttpRequest } from '@marblejs/http';
import { getContentTypeUnsafe } from '@marblejs/http/dist/+internal/contentType.util';
import { fromReadableStream } from '@marblejs/core/dist/+internal/observable';

export const matchType = (type: string[]) => (req: HttpRequest): boolean =>
  !!typeIs.is(getContentTypeUnsafe(req.headers), type);

export const isMultipart = (req: HttpRequest): boolean =>
  getContentTypeUnsafe(req.headers).includes('multipart/');

export const hasBody = (req: HttpRequest): boolean =>
  req.body !== undefined && req.body !== null;

export const getBody = (req: HttpRequest): Observable<Buffer> =>
  pipe(
    fromReadableStream(req),
    toArray(),
    map(chunks => Buffer.concat(chunks)),
  );
