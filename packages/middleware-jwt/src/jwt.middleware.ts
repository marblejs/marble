import { throwError, of, Observable } from 'rxjs';
import { map, mergeMap, catchError, tap, mapTo } from 'rxjs/operators';
import { HttpError, HttpStatus, HttpMiddlewareEffect, HttpRequest } from '@marblejs/core';
import { parseAuthorizationHeader } from './jwt.util';
import { verifyToken$, VerifyOptions } from './jwt.factory';

export type AuthorizeMiddlewareConfig = VerifyOptions;

const assignPayloadToRequest = (req: HttpRequest) => (payload: object) => req.user = payload;

export const authorize$ = (
  config: AuthorizeMiddlewareConfig,
  verifyPayload$: (payload: any) => Observable<object>,
): HttpMiddlewareEffect => req$ =>
  req$.pipe(
    mergeMap(req => of(req).pipe(
      map(parseAuthorizationHeader),
      mergeMap(verifyToken$<object>(config)),
      mergeMap(verifyPayload$),
      tap(assignPayloadToRequest(req)),
      mapTo(req),
      catchError(() =>
        throwError(new HttpError('Unauthorized', HttpStatus.UNAUTHORIZED, undefined, req))
      )
    )),
  );
