import { r, HttpError, HttpStatus, combineRoutes, use, switchToProtocol } from '@marblejs/core';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { throwError } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { user$ } from './user.effects';
import { static$ } from './static.effects';
import { WebSocketServerToken } from '../tokens';

const rootValiadtor$ = requestValidator$({
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
  r.useEffect((req$, _, { ask }) => req$.pipe(
    use(rootValiadtor$),
    map(req => req.params.version),
    map(version => `API version: ${version}`),
    tap(message => ask(WebSocketServerToken).map(server =>
      server.sendBroadcastResponse({ type: 'ROOT', payload: message })),
    ),
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

const webSockets$ = r.pipe(
  r.matchPath('/ws'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    switchToProtocol('websocket')
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
  [ root$, user$, static$, notImplemented$, webSockets$, notFound$ ],
);
