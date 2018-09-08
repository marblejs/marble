import { EffectFactory, combineRoutes } from '@marblejs/core';
import { map, switchMap } from 'rxjs/operators';
import { Dao } from '../fakes/dao.fake';
import { authorize$ } from '../middlewares/auth.middleware';

const getUsers$ = EffectFactory
  .matchPath('/')
  .matchType('GET')
  .use(req$ => req$.pipe(
    switchMap(Dao.getUsers),
    map(users => ({ body: users })),
  ));

const getUser$ = EffectFactory
  .matchPath('/:id')
  .matchType('GET')
  .use(req$ => req$.pipe(
    map(req => req.params.id),
    switchMap(Dao.getUserById),
    map(user => ({ body: user })),
  ));

const postUser$ = EffectFactory
  .matchPath('/')
  .matchType('POST')
  .use(req$ => req$.pipe(
    map(req => req.body),
    switchMap(Dao.postUser),
    map(response => ({ body: response })),
  ));

export const user$ = combineRoutes('/user', {
  middlewares: [authorize$],
  effects: [getUsers$, getUser$, postUser$],
});
