import { EffectFactory, HttpError, HttpStatus, combineRoutes } from '@marblejs/core';
import { throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { user$ } from './user.controller';

const root$ = EffectFactory
  .matchPath('/')
  .matchType('GET')
  .use(req$ => req$.pipe(
    map(req => ({
      body: `API root @ ${req.url}`,
    })),
  );

const notFound$ = EffectFactory
  .matchPath('*')
  .matchType('*')
  .use(req$ => req$.pipe(
    switchMap(() =>
      throwError(new HttpError('Route not found', HttpStatus.NOT_FOUND))
    )
  ));

export const api$ = combineRoutes(
  '/api/v1',
  [ root$, user$, notFound$ ],
);
