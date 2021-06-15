import { HttpError, HttpStatus, HttpMiddlewareEffect } from '@marblejs/core';
import { of, throwError } from 'rxjs';
import { catchError, map, tap, mapTo, mergeMap } from 'rxjs/operators';
import { pipe } from 'fp-ts/lib/function';
import { defaultParser } from './parsers';
import { RequestBodyParser } from './body.model';
import { matchType, getBody, hasBody, isMultipart } from './body.util';

const PARSEABLE_METHODS = ['POST', 'PUT', 'PATCH'];

interface BodyParserOptions {
  parser?: RequestBodyParser;
  type?: string[];
}

export const bodyParser$ = ({
  type = ['*/*'],
  parser = defaultParser,
}: BodyParserOptions = {}): HttpMiddlewareEffect => req$ =>
  req$.pipe(
    mergeMap(req =>
      PARSEABLE_METHODS.includes(req.method)
      && !hasBody(req)
      && !isMultipart(req)
      && matchType(type)(req)
      ? pipe(
        getBody(req),
        map(parser(req)),
        tap(body => req.body = body),
        mapTo(req),
        catchError(error => throwError(() =>
          new HttpError(`Request body parse error: "${error.toString()}"`, HttpStatus.BAD_REQUEST, undefined, req),
        )))
      : of(req),
    ),
  );
