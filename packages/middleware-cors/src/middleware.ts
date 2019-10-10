import { HttpMethod, HttpMiddlewareEffect, HttpStatus } from '@marblejs/core';
import { tap } from 'rxjs/operators';
import { isString } from 'util';

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

export const cors$ = (options: CORSOptions = {}): HttpMiddlewareEffect => (req$, metadata) => {
  options = { ...DEFAULT_OPTIONS, ...options };

  return req$.pipe(
    tap(req => {
      // skip if not a CORS request
      if (!isString(req.headers.origin)) {
        return;
      }

      if (req.method === 'OPTIONS') {
        configurePreflightResponse(req, metadata.client, options);
        metadata.client.end();
      } else {
        configureResponse(req, metadata.client, options);
      }
    }),
  );
};
