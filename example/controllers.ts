import { filter, map } from 'rxjs/operators';
import { RequestEffect } from '../src';
import { StatusCode } from '../src/util';

export const root$: RequestEffect = request$ => request$
  .pipe(
    filter(http => http.url === '/'),
    map(http => ({
      status: StatusCode.OK,
      body: { data: `API root @ ${http.url}` },
    }))
  );

export const hello$: RequestEffect = request$ => request$
  .pipe(
    filter(http => http.url === '/hello'),
    map(http => ({
      status: StatusCode.OK,
      body: { data: `Hello, world! @ ${http.url}` },
    }))
  );
