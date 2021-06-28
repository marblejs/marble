import { HttpError, HttpStatus, HttpMiddlewareEffect } from '@marblejs/http';
import { iif, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { isAuthorized } from '../fakes/auth.fake';

export const authorize$: HttpMiddlewareEffect = req$ =>
  req$.pipe(
    switchMap(req => iif(
      () => !isAuthorized(req),
      throwError(() => new HttpError('Unauthorized', HttpStatus.UNAUTHORIZED)),
      of(req),
    )),
  );
