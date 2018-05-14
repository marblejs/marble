import { map, switchMap } from 'rxjs/operators';
import { Effect, combineRoutes, matchPath, matchType } from '../../packages/core/src';
import { Dao } from '../fakes/dao.fake';

const getUsers$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    switchMap(Dao.getUsers),
    map(users => ({ body: users }))
  );

const postUser$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('POST'),
    map(req => req.body),
    switchMap(Dao.postUser),
    map(response => ({ body: response }))
  );

export const user$ = combineRoutes(
  '/user',
  [ getUsers$, postUser$ ],
);
