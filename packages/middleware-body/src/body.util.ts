import * as typeIs from 'type-is';
import { HttpRequest } from '@marblejs/core';
import { fromReadableStream } from '@marblejs/core/dist/+internal';
import { toArray, map } from 'rxjs/operators';

export const matchType = (type: string[]) => (req: HttpRequest) =>
  !!(req.headers['content-type'] && typeIs.is(req.headers['content-type'], type));

export const hasBody = (req: HttpRequest): boolean =>
  req.body !== undefined && req.body !== null;

export const getBody = (req: HttpRequest) =>
  fromReadableStream(req).pipe(
    toArray(),
    map(chunks => Buffer.concat(chunks)),
  );
