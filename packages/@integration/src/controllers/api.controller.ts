import { EffectFactory, HttpError, HttpStatus, combineRoutes } from '@marblejs/core';
import { throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { user$ } from './user.controller';
import { static$ } from './static.controller';

const root$ = EffectFactory
  .matchPath('/')
  .matchType('GET')
  .use(req$ => req$.pipe(
    map(req => req.params.version),
    map(version => ({ body: `API version: ${version}` })),
  ));

const notImplemented$ = EffectFactory
  .matchPath('/error')
  .matchType('GET')
  .use(req$ => req$
    .pipe(
      switchMap(() => throwError(
        new HttpError('Route not implemented', HttpStatus.NOT_IMPLEMENTED, { reason: 'Not implemented' })
      )),
    )
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
  '/api/:version',
  [ root$, user$, static$, notImplemented$, notFound$ ],
);
