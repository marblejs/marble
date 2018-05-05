import { map } from 'rxjs/operators';
import { Effect, HttpStatus, matchPath, matchType } from '../src';

export const root$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    map(req => ({
      status: HttpStatus.OK,
      body: { data: `API root @ ${req.url}` },
    }))
  );

export const hello$: Effect = request$ => request$
  .pipe(
    matchPath('/hello'),
    matchType('POST'),
    map(req => ({
      status: HttpStatus.OK,
      body: { data: `Hello, ${req.body.data}! @ ${req.url}` },
    }))
  );
