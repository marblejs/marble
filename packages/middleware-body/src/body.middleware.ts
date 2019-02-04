import { HttpError, HttpStatus, HttpMiddlewareEffect } from '@marblejs/core';
import { of, throwError, iif } from 'rxjs';
import { catchError, map, switchMap, tap, mapTo } from 'rxjs/operators';
import { defaultParser } from './serializers';
import { BodyParser } from './body.model';
import { matchType, getBody, hasBody } from './body.util';

const PARSEABLE_METHODS = ['POST', 'PUT', 'PATCH'];

interface BodyParserOptions {
  parser?: BodyParser;
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
        && matchType(type)(req),
      getBody(req).pipe(
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
