import { Effect, HttpError, HttpRequest, HttpStatus } from '@marblejs/core';
import { Observable, merge, throwError } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { isAuthorized } from '../fakes/auth.fake';

const authorized$ = (req$: Observable<HttpRequest>) =>
  req$.pipe(
    filter(req => isAuthorized(req)),
  );

const unauthorized$ = (req$: Observable<HttpRequest>) =>
  req$.pipe(
    filter(req => !isAuthorized(req)),
    switchMap(req =>
      throwError(new HttpError('Unauthorized', HttpStatus.UNAUTHORIZED)),
    ),
  );

export const authorize$: Effect<HttpRequest> = request$ =>
  request$.pipe(
    switchMap(() => merge(
      authorized$(request$),
      unauthorized$(request$),
    )),
  );
