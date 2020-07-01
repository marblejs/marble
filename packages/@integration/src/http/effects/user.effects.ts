import { combineRoutes, HttpError, HttpStatus, r } from '@marblejs/core';
import { validateRequest, t } from '@marblejs/middleware-io';
import { throwError, from, of } from 'rxjs';
import { map, switchMap, catchError, mergeMap, bufferCount } from 'rxjs/operators';
import { Dao } from '../fakes/dao.fake';
import { simulateRandomFailure, simulateRandomDelay } from '../fakes/random';
import { authorize$ } from '../middlewares/auth.middleware';

const validateGetUser = validateRequest({
  params: t.type({ id: t.string }),
});

const validatePostUser = validateRequest({
  body: t.type({
    user: t.type({ id: t.string })
  }),
});

const getUserList$ = r.pipe(
  r.matchPath('/'),
  r.matchType('GET'),
  r.useEffect(req$ => {

    return req$.pipe(
      mergeMap(Dao.getUsers),
      map(users => ({ body: users })),
    );
  }));

const getUser$ = r.pipe(
  r.matchPath('/:id'),
  r.matchType('GET'),
  r.useEffect(req$ => {

    return req$.pipe(
      validateGetUser,
      map(req => req.params.id),
      mergeMap(id => Dao
        .getUserById(id)
        .pipe(catchError(() => throwError(
          new HttpError('User does not exist', HttpStatus.NOT_FOUND)
        )),
      )),
      simulateRandomDelay,
      simulateRandomFailure,
      map(user => ({ body: user })),
    );
  }));

const getUserBuffered$ = r.pipe(
  r.applyMeta({ continuous: true }),
  r.matchPath('/:id/buffered'),
  r.matchType('GET'),
  r.useEffect(req$ => {

    return req$.pipe(
      bufferCount(2),
      mergeMap(out => from(out).pipe(
        mergeMap(request => of(request).pipe(
          validateGetUser,
          map(req => req.params.id),
          switchMap(Dao.getUserById),
          map(user => ({ body: user, request })),
          catchError(() => throwError(
            new HttpError('User does not exist', HttpStatus.NOT_FOUND)
          )),
        )),
      )),
    );
  }));

const postUser$ = r.pipe(
  r.matchPath('/'),
  r.matchType('POST'),
  r.useEffect(req$ => {

    return req$.pipe(
      validatePostUser,
      map(req => req.body),
      mergeMap(Dao.postUser),
      map(body => ({ body })),
    );
  }));

export const user$ = combineRoutes('/user', {
  middlewares: [authorize$],
  effects: [getUserList$, getUser$, getUserBuffered$, postUser$],
});
