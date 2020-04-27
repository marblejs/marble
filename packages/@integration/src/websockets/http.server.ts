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
import { IO } from 'fp-ts/lib/IO';
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

export const server = createServer({
  port: 1337,
  listener: httpListener({
    middlewares: [logger$()],
    effects: [root$],
  }),
  dependencies: [
    bindEagerlyTo(WebSocketServerToken)(async () =>
      (await webSocketServer)()
    ),
  ],
  event$: combineEffects(
    upgrade$,
  ),
});

const main: IO<void> = async () =>
  !isTestEnv() && await (await server)();

main();
