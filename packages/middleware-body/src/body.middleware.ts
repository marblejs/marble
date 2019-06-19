import { HttpError, HttpStatus, HttpMiddlewareEffect } from '@marblejs/core';
import { of, throwError, iif } from 'rxjs';
import { catchError, map, switchMap, tap, mapTo, mergeMap } from 'rxjs/operators';
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
    switchMap(req => iif(
      () =>
        PARSEABLE_METHODS.includes(req.method)
        && !hasBody(req)
        && !isMultipart(req)
        && matchType(type)(req),
      of(req).pipe(
        mergeMap(getBody),
        map(parser(req)),
        tap(body => req.body = body),
        mapTo(req),
        catchError(() => throwError(
          new HttpError('Request body parse error', HttpStatus.BAD_REQUEST),
        ))
      ),
      of(req),
    )),
  );
