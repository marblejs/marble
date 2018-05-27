import { Effect, HttpError, HttpRequest, HttpStatus } from '@marblejs/core';
import { iif, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { isAuthorized } from '../fakes/auth.fake';

export const authorize$: Effect<HttpRequest> = request$ =>
  request$.pipe(
    switchMap(req => iif(
      () => !isAuthorized(req),
      throwError(new HttpError('Unauthorized', HttpStatus.UNAUTHORIZED)),
      of(req),
    )),
  );
