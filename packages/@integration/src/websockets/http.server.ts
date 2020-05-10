import {
  r,
  bindEagerlyTo,
  createContextToken,
  createServer,
  matchEvent,
  ServerEvent,
  httpListener,
  HttpServerEffect,
  useContext,
  combineEffects,
} from '@marblejs/core';
import { mapToServer, WebSocketServerConnection } from '@marblejs/websockets';
import { logger$ } from '@marblejs/middleware-logger';
import { isTestEnv } from '@marblejs/core/dist/+internal/utils';
import * as T from 'fp-ts/lib/Task';
import { pipe } from 'fp-ts/lib/pipeable';
import { tap, map } from 'rxjs/operators';
import { webSocketServer } from './websockets.server';

export const WebSocketServerToken = createContextToken<WebSocketServerConnection>('WebSocketServerConnection');

const root$ = r.pipe(
  r.matchPath('/'),
  r.matchType('GET'),
  r.useEffect((req$, ctx) => {
    const webSocketServer = useContext(WebSocketServerToken)(ctx.ask);

    return req$.pipe(
      tap(() => webSocketServer.sendBroadcastResponse({ type: 'ROOT', payload: 'Hello' })),
      map(body => ({ body })),
    );
  }));

const upgrade$: HttpServerEffect = (event$, ctx) =>
  event$.pipe(
    matchEvent(ServerEvent.upgrade),
    mapToServer({
      path: '/api/:version/ws',
      server: ctx.ask(WebSocketServerToken),
    }),
  );

const event$ = combineEffects(
  upgrade$,
);

const dependencies = [
  bindEagerlyTo(WebSocketServerToken)(async () =>
    (await webSocketServer)()
  ),
];

const listener = httpListener({
  middlewares: [logger$()],
  effects: [root$],
});

export const server = () => createServer({
  port: 1337,
  listener,
  dependencies,
  event$,
});

export const main = !isTestEnv()
  ? pipe(server, T.map(run => run()))
  : T.of(undefined);

main();
