import { map } from 'rxjs/operators';
import { Effect, combineRoutes, matchPath, matchType } from '../../src';
import { user$ } from './user.controller';

const root$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    map(req => ({
      body: { data: `API root @ ${req.url}` },
    }))
  );

export const api$ = combineRoutes(
  '/api/v1',
  [ root$, user$ ],
);
