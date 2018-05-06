import { map } from 'rxjs/operators';
import { Effect, combineRoutes, matchPath, matchType } from '../src';

export const root$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    map(req => ({
      body: { data: `API root @ ${req.url}` },
    }))
  );

export const hello$: Effect = request$ => request$
  .pipe(
    matchPath('/hello'),
    matchType('POST'),
    map(req => ({
      body: { data: `Hello, ${req.body.data}! @ ${req.url}` },
    }))
  );


const route1$: Effect = request$ => request$
  .pipe(
    matchPath('/route1'),
    matchType('GET'),
    map(req => ({
      body: { data: `1 @ ${req.url}` },
    }))
  );

export const apiV1$ = combineRoutes(
  '/api/v1',
  [ route1$ ],
);
