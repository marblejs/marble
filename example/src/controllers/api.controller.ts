import { Effect, combineRoutes, matchPath, matchType } from '@marblejs/core';
import { map } from 'rxjs/operators';
import { user$ } from './user.controller';

const root$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    map(req => ({
      body: `API root @ ${req.url}`,
    })),
  );

export const api$ = combineRoutes(
  '/api/v1',
  [ root$, user$ ],
);
