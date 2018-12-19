import { EffectFactory, HttpError, HttpStatus, combineRoutes, use, switchToProtocol } from '@marblejs/core';
import { validator$, Joi } from '@marblejs/middleware-joi';
import { throwError } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { user$ } from './user.effects';
import { static$ } from './static.effects';

const rootValidator$ = validator$({
  params: {
    version: Joi.string().required(),
  },
}, { allowUnknown: true });

const root$ = EffectFactory
  .matchPath('/')
  .matchType('GET')
  .use(req$ => req$.pipe(
    use(rootValidator$),
    map(req => req.params.version),
    map(version => ({ body: `API version: ${version}` })),
  ));

const notImplemented$ = EffectFactory
  .matchPath('/error')
  .matchType('GET')
  .use(req$ => req$.pipe(
    mergeMap(() => throwError(
      new HttpError('Route not implemented', HttpStatus.NOT_IMPLEMENTED, { reason: 'Not implemented' })
    )),
  ));


const webSockets$ = EffectFactory
  .matchPath('/ws')
  .matchType('GET')
  .use(req$ => req$.pipe(
    switchToProtocol('websocket')
  ));

const notFound$ = EffectFactory
  .matchPath('*')
  .matchType('*')
  .use(req$ => req$.pipe(
    mergeMap(() => throwError(
      new HttpError('Route not found', HttpStatus.NOT_FOUND)
    )),
  ));

export const api$ = combineRoutes(
  '/api/:version',
  [ root$, user$, static$, notImplemented$, webSockets$, notFound$ ],
);
