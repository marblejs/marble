import { map } from 'rxjs/operators';
import { Effect, combineRoutes, matchPath, matchType } from '../../src';

const getUser$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    map(() => ({ id: '123', firstName: 'Jozef', lastName: 'Flakus' })),
    map(body => ({ body }))
  );

const postUser$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('POST'),
    map(req => ({ data: req.body })),
    map(body => ({ body }))
  );

export const user$ = combineRoutes(
  '/user',
  [ getUser$, postUser$ ],
);
