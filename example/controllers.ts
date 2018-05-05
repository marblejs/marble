import { filter, map } from 'rxjs/operators';
import { Effect, HttpStatus, ofType } from '../src';

export const root$: Effect = request$ => request$
  .pipe(
    filter(req => req.url === '/'),
    ofType('GET'),
    map(req => ({
      status: HttpStatus.OK,
      body: { data: `API root @ ${req.url}` },
    }))
  );

export const hello$: Effect = request$ => request$
  .pipe(
    filter(req => req.url === '/hello'),
    ofType('POST'),
    map(req => ({
      status: HttpStatus.OK,
      body: { data: `Hello, ${req.body.data}! @ ${req.url}` },
    }))
  );
