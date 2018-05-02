import { filter, map } from 'rxjs/operators';
import { Effect, EffectResponse } from '../src';
import { StatusCode } from '../src/util';

export const root$: Effect = request$ => request$
  .pipe(
    filter(http => http.url === '/'),
    map(http => ({
      status: StatusCode.OK,
      body: { data: `API root @ ${http.url}` },
    }))
  );

export const hello$: Effect = request$ => request$
  .pipe(
    filter(http => http.url === '/hello'),
    map(http => ({
      status: StatusCode.OK,
      body: { data: `Hello, world! @ ${http.url}` },
    }))
  );
