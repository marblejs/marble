import { r, HttpError, HttpStatus, combineRoutes } from '@marblejs/core';
import { validateRequest, t } from '@marblejs/middleware-io';
import { throwError } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { user$ } from './user.effects';
import { static$ } from './static.effects';

const validate = validateRequest({
  params: t.type({
    version: t.union([
      t.literal('v1'),
      t.literal('v2'),
    ]),
  }),
});

const root$ = r.pipe(
  r.matchPath('/'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    validate,
    map(req => req.params.version),
    map(version => `API version: ${version}`),
    map(message => ({ body: message })),
  )));

const notImplemented$ = r.pipe(
  r.matchPath('/error'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    mergeMap(() => throwError(
      new HttpError('Route not implemented', HttpStatus.NOT_IMPLEMENTED, { reason: 'Not implemented' })
    )),
  )));

const notFound$ = r.pipe(
  r.matchPath('*'),
  r.matchType('*'),
  r.useEffect(req$ => req$.pipe(
    mergeMap(() => throwError(
      new HttpError('Route not found', HttpStatus.NOT_FOUND)
    )),
  )));

export const api$ = combineRoutes(
  '/api/:version',
  [ root$, user$, static$, notImplemented$, notFound$ ],
);
