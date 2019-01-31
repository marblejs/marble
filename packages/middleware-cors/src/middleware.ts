import { HttpMethod, HttpStatus, Middleware } from '@marblejs/core';
import { tap } from 'rxjs/operators';
import { isString } from 'util';

import { configurePreflightResponse, configureResponse } from './configureHeaders';

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

export const cors$ = (options: CORSOptions = {}): Middleware => (req$, res) => {
  options = { ...DEFAULT_OPTIONS, ...options };

  return req$.pipe(
    tap(req => {
      // skip if not a CORS request
      if (!isString(req.headers.origin)) {
        return;
      }

      if (req.method === 'OPTIONS') {
        configurePreflightResponse(req, res, options);
        res.end();
      } else {
        configureResponse(req, res, options);
      }
    }),
  );
};
