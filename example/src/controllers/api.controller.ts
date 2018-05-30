import { Effect, HttpError, HttpStatus, combineRoutes, matchPath, matchType } from '@marblejs/core';
import { throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { user$ } from './user.controller';

const root$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    map(req => ({
      body: `API root @ ${req.url}`,
    })),
  );

const notFound$: Effect = request$ => request$
  .pipe(
    matchPath('*'),
    matchType('*'),
    switchMap(() =>
      throwError(new HttpError('Route not found', HttpStatus.NOT_FOUND))
    )
  );

export const api$ = combineRoutes(
  '/api/v1',
  [ root$, user$, notFound$ ],
);
