import { filter, map } from 'rxjs/operators';
import { Effect } from '../src';
import { StatusCode } from '../src/util';

export const root$: Effect = request$ => request$
  .pipe(
    filter(req => req.url === '/'),
    map(req => ({
      status: StatusCode.OK,
      body: { data: `API root @ ${req.url}` },
    }))
  );

export const hello$: Effect = request$ => request$
  .pipe(
    filter(req => req.url === '/hello'),
    map(req => ({
      status: StatusCode.OK,
      body: { data: `Hello, world! @ ${req.url}` },
    }))
  );
