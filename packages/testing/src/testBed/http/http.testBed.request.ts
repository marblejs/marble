import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { HttpMethod, HttpHeaders } from '@marblejs/http';
import { createRequestMetadataHeader } from '@marblejs/http/dist/+internal/metadata.util';
import { ContentType, getMimeType, getContentType } from '@marblejs/http/dist/+internal/contentType.util';
import { HttpTestBedRequest, WithBodyApplied } from './http.testBed.request.interface';

export const createRequest = (port: number, host: string, headers?: HttpHeaders) =>
  <T extends HttpMethod>(method: T): HttpTestBedRequest<T> => ({
    protocol: 'http:',
    path: '/',
    headers: {
      ...createRequestMetadataHeader(),
      ...headers,
    },
    method,
    host,
    port,
  });

export const withPath = (path: string) => <T extends HttpMethod>(req: HttpTestBedRequest<T>): HttpTestBedRequest<T> => ({
  ...req,
  path,
});

export const withHeaders = (headers: HttpHeaders) => <T extends HttpMethod>(req: HttpTestBedRequest<T>): HttpTestBedRequest<T> => ({
  ...req,
  headers: { ...req.headers, ...headers },
});

export const withBody = <T>(body: T) => <U extends 'POST' | 'PUT' | 'PATCH'>(req: HttpTestBedRequest<U>): HttpTestBedRequest<U> & WithBodyApplied<T> =>
  pipe(
    getContentType(req.headers),
    O.map(() => ({ ...req, body })),
    O.getOrElse(() => pipe(
      getMimeType(body, req.path),
      type => withHeaders({ 'Content-Type': type ?? ContentType.APPLICATION_JSON })(req),
      req => ({ ...req, body }),
    ))
  );
