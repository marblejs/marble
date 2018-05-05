import { map } from 'rxjs/operators';
import { Effect, matchPath, matchType } from '../src';

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
