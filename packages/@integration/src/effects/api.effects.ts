import { EffectFactory, HttpError, HttpStatus, combineRoutes, use, switchToProtocol } from '@marblejs/core';
import { validator$, Joi } from '@marblejs/middleware-joi';
import { MarbleWebSocketServer } from '../../../websockets/src/websocket.interface';
import { throwError } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { user$ } from './user.effects';
import { static$ } from './static.effects';
import { AppDependencies } from '../app.dependencies';

const rootValidator$ = validator$({
  params: {
    version: Joi.string().required(),
  },
}, { allowUnknown: true });

const root$ = EffectFactory
  .matchPath('/')
  .matchType('GET')
  .use((req$, _, inject) => req$.pipe(
    use(rootValidator$),
    map(req => req.params.version),
    map(version => `API version: ${version}`),
    tap(message => {
      const wsServer = inject<MarbleWebSocketServer>(AppDependencies.WS_SERVER);
      if (wsServer) {
        wsServer.sendBroadcastResponse({ type: 'ROOT', payload: message });
      }
    }),
    map(message => ({ body: message })),
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
