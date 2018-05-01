import { filter, map } from 'rxjs/operators';
import { RequestEffect } from '../src';

export const root$: RequestEffect = request$ => request$
  .pipe(
    filter(http => http.url === '/'),
    map(http => ({
      status: 200,
      body: { data: `API root @ ${http.url}` },
    }))
  );

export const hello$: RequestEffect = request$ => request$
  .pipe(
    filter(http => http.url === '/hello'),
    map(http => ({
      status: 200,
      body: { data: `Hello, world! @ ${http.url}` },
    }))
  );
