import { HttpError, HttpStatus, Middleware, HttpMethod } from '@marblejs/core';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { configureHeaders } from './configureHeaders';

export interface CORSOptions {
  origin?: string | string[] | RegExp;
  methods?: HttpMethod[];
  optionsSuccessStatus?: HttpStatus;
  allowHeaders?: string | string[];
  withCredentials?: boolean;
}

const DEFAULT_OPTIONS: CORSOptions = {
  origin: '*',
  methods: ['HEAD', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  withCredentials: false,
  optionsSuccessStatus: HttpStatus.NO_CONTENT,
  allowHeaders: '*',
};

export const cors$ = (options: CORSOptions = {}): Middleware => (req$, res) => {
  options = { ...DEFAULT_OPTIONS, ...options };

  return req$.pipe(
    tap(req => {
      configureHeaders(req, res, options);

      if (req.method === 'OPTIONS') {
        res.end();
      }
    }),
    catchError(() =>
      throwError(new HttpError('Not allowed by CORS', HttpStatus.BAD_REQUEST)),
    ),
  );
};
