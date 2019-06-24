import * as typeIs from 'type-is';
import { HttpRequest } from '@marblejs/core';
import { fromReadableStream, getContentType } from '@marblejs/core/dist/+internal';
import { map, toArray } from 'rxjs/operators';

export const matchType = (type: string[]) => (req: HttpRequest) =>
  !!typeIs.is(getContentType(req.headers), type);

export const isMultipart = (req: HttpRequest): boolean =>
  getContentType(req.headers).includes('multipart/')

export const hasBody = (req: HttpRequest): boolean =>
  req.body !== undefined && req.body !== null;

export const getBody = (req: HttpRequest) =>
  fromReadableStream(req).pipe(
    toArray(),
    map(chunks => Buffer.concat(chunks)),
  );
