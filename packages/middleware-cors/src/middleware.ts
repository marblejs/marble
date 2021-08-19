import { of, EMPTY, defer } from 'rxjs';
import { mergeMap, mergeMapTo } from 'rxjs/operators';
import { isString } from '@marblejs/core/dist/+internal/utils';
import { endRequest } from '@marblejs/http/dist/response/http.responseHandler';
import { HttpMethod, HttpMiddlewareEffect, HttpRequest, HttpStatus } from '@marblejs/http';
import { pipe } from 'fp-ts/lib/pipeable';
import { configurePreflightResponse } from './configurePreflightResponse';
import { configureResponse } from './configureResponse';

export interface CORSOptions {
  origin?: string | string[] | RegExp;
  methods?: HttpMethod[];
  optionsSuccessStatus?: HttpStatus;
  allowHeaders?: string | string[];
  exposeHeaders?: string[];
  withCredentials?: boolean;
  maxAge?: number;
}

const DEFAULT_OPTIONS: CORSOptions = {
  origin: '*',
  methods: ['HEAD', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  withCredentials: false,
  optionsSuccessStatus: HttpStatus.NO_CONTENT,
};

const isCORSRequest = (req: HttpRequest): boolean =>
  !isString(req.headers.origin);

export const cors$ = (options: CORSOptions = {}): HttpMiddlewareEffect => req$ => {
  options = { ...DEFAULT_OPTIONS, ...options };

  return req$.pipe(
    mergeMap(req => {
      if (isCORSRequest(req))
        return of(req);

      if (req.method === 'OPTIONS') {
        configurePreflightResponse(req, req.response, options);
        return pipe(
          defer(endRequest(req.response)),
          mergeMapTo(EMPTY));
      }

      configureResponse(req, req.response, options);
      return of(req);
    }),
  );
};
