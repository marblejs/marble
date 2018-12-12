import { EffectFactory, combineRoutes, HttpError, HttpStatus, use } from '@marblejs/core';
import { validator$, Joi } from '@marblejs/middleware-joi';
import { throwError, of } from 'rxjs';
import { map, switchMap, catchError, mergeMap } from 'rxjs/operators';
import { Dao } from '../fakes/dao.fake';
import { authorize$ } from '../middlewares/auth.middleware';

const getUserValidator$ = validator$({
  params: {
    id: Joi.string(),
  },
}, { allowUnknown: true });

const getUserList$ = EffectFactory
  .matchPath('/')
  .matchType('GET')
  .use(req$ => req$.pipe(
    mergeMap(Dao.getUsers),
    map(users => ({ body: users })),
  ));

const getUser$ = EffectFactory
  .matchPath('/:id')
  .matchType('GET')
  .use(req$ => req$.pipe(
    use(getUserValidator$),
    mergeMap(req => of(req).pipe(
      map(req => req.params.id),
      switchMap(Dao.getUserById),
      map(user => ({ body: user })),
      catchError(() => throwError(
        new HttpError('User does not exist', HttpStatus.NOT_FOUND)
      ))
    )),
  ));

const postUser$ = EffectFactory
  .matchPath('/')
  .matchType('POST')
  .use(req$ => req$.pipe(
    map(req => req.body),
    mergeMap(Dao.postUser),
    map(response => ({ body: response })),
  ));

export const user$ = combineRoutes('/user', {
  middlewares: [authorize$],
  effects: [getUserList$, getUser$, postUser$],
});
