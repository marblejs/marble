import { Effect, combineRoutes, matchPath, matchType, use } from '@marblejs/core';
import { map, switchMap } from 'rxjs/operators';
import { Dao } from '../fakes/dao.fake';
import { authorize$ } from '../middlewares/auth.middleware';

const getUsers$: Effect = request$ =>
  request$.pipe(
    matchPath('/'),
    matchType('GET'),
    use(authorize$),
    switchMap(Dao.getUsers),
    map(users => ({ body: users })),
  );

const postUser$: Effect = request$ =>
  request$.pipe(
    matchPath('/'),
    matchType('POST'),
    use(authorize$),
    map(req => req.body),
    switchMap(Dao.postUser),
    map(response => ({ body: response })),
  );

export const user$ = combineRoutes(
  '/user',
  [getUsers$, postUser$],
);
