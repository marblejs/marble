import { combineRoutes, HttpError, HttpStatus, use, r } from '@marblejs/core';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { throwError, of } from 'rxjs';
import { map, switchMap, catchError, mergeMap } from 'rxjs/operators';
import { Dao } from '../fakes/dao.fake';
import { authorize$ } from '../middlewares/auth.middleware';

const getUserValidator$ = requestValidator$({
  params: t.type({ id: t.string }),
});

const postUserValidator$ = requestValidator$({
  body: t.type({
    user: t.type({ id: t.string })
  }),
});

const getUserList$ = r.pipe(
  r.matchPath('/'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    mergeMap(Dao.getUsers),
    map(users => ({ body: users })),
  )));

const getUser$ = r.pipe(
  r.matchPath('/:id'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    use(getUserValidator$),
    mergeMap(req => of(req).pipe(
      map(req => req.params.id),
      switchMap(Dao.getUserById),
      map(user => ({ body: user })),
      catchError(() => throwError(
        new HttpError('User does not exist', HttpStatus.NOT_FOUND)
      ))
    )),
  )));

const postUser$ = r.pipe(
  r.matchPath('/'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    use(postUserValidator$),
    map(req => req.body),
    mergeMap(Dao.postUser),
    map(body => ({ body })),
  )));

export const user$ = combineRoutes('/user', {
  middlewares: [authorize$],
  effects: [getUserList$, getUser$, postUser$],
});
