import { HttpMethod, HttpHeaders } from '@marblejs/http';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { getHeaderValue } from '@marblejs/http/dist/+internal/header.util';
import { ContentType, getMimeType } from '@marblejs/http/dist/+internal/contentType.util';
import { HttpTestBedRequest, WithBodyApplied } from './http.testBed.request.interface';
import { createTestingRequestHeader } from './http.testBed.util';

export const createRequest = (port: number, host: string, headers?: HttpHeaders) =>
  <T extends HttpMethod>(method: T): HttpTestBedRequest<T> => ({
    protocol: 'http:',
    path: '/',
    headers: {
      ...createTestingRequestHeader(),
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
    getHeader('Content-Type')(req),
    O.map(() => ({ ...req, body })),
    O.getOrElse(() => pipe(
      getMimeType(body, req.path),
      type => withHeaders({ 'Content-Type': type ?? ContentType.APPLICATION_JSON })(req),
      req => ({ ...req, body }),
    ))
  );

export const getHeader = <T extends string = string>(key: string) => (req: HttpTestBedRequest<any>): O.Option<T> =>
  getHeaderValue<T>(key)(req.headers);
