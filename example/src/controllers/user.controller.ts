import { EffectFactory, combineRoutes, use } from '@marblejs/core';
import { map, switchMap } from 'rxjs/operators';
import { Dao } from '../fakes/dao.fake';
import { authorize$ } from '../middlewares/auth.middleware';

const getUsers$ = EffectFactory
  .matchPath('/')
  .matchType('GET')
  .use(req$ => req$.pipe(
    use(authorize$),
    switchMap(Dao.getUsers),
    map(users => ({ body: users })),
  ));

const postUser$ = EffectFactory
  .matchPath('/')
  .matchType('POST')
  .use(req$ => req$.pipe(
    use(authorize$),
    map(req => req.body),
    switchMap(Dao.postUser),
    map(response => ({ body: response })),
  ));

export const user$ = combineRoutes(
  '/user',
  [getUsers$, postUser$],
);
