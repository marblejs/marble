import { throwError, of } from 'rxjs';
import { map, flatMap, catchError, tap } from 'rxjs/operators';
import { HttpError, HttpStatus, Middleware, HttpRequest } from '@marblejs/core';
import { parseAuthorizationHeader } from './jwt.util';
import { verifyToken$, VerifyOptions } from './jwt.factory';

export type AuthorizeMiddlewareConfig = VerifyOptions;

const assignPayloadToRequest = (req: HttpRequest) => (payload: object) => req.user = payload;

export const authorize$ = (config: AuthorizeMiddlewareConfig): Middleware => req$ =>
  req$.pipe(
    flatMap(req => of(req).pipe(
      map(parseAuthorizationHeader),
      flatMap(verifyToken$(config)),
      tap(assignPayloadToRequest(req)),
      flatMap(() => req$),
    )),
    catchError(() =>
      throwError(new HttpError('Unauthorized', HttpStatus.UNAUTHORIZED))
    )
  );
