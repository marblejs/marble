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
} from '@marblejs/core';
import { mapToServer, MarbleWebSocketServer } from '@marblejs/websockets';
import { logger$ } from '@marblejs/middleware-logger';
import { merge } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { webSocketServer } from './websockets.server';

export const WsServerToken = createContextToken<MarbleWebSocketServer>('MarbleWebSocketServer');

const root$ = r.pipe(
  r.matchPath('/'),
  r.matchType('GET'),
  r.useEffect((req$, { ask }) => {
    const wsServer = useContext(WsServerToken)(ask);

    return req$.pipe(
      tap(() => wsServer.sendBroadcastResponse({ type: 'ROOT', payload: 'Hello' })),
      map(body => ({ body })),
    );
  }));

const upgrade$: HttpServerEffect = (event$, { ask }) =>
  event$.pipe(
    matchEvent(ServerEvent.upgrade),
    mapToServer({
      path: '/api/:version/ws',
      server: ask(WsServerToken),
    }),
  );

const listening$: HttpServerEffect = event$ =>
  event$.pipe(
    matchEvent(ServerEvent.listening),
    map(event => event.payload),
    tap(({ port, host }) => console.log(`Server running @ http://${host}:${port}/ 🚀`)),
  );

export const server = createServer({
  port: 1337,
  httpListener: httpListener({
    middlewares: [logger$()],
    effects: [root$],
  }),
  dependencies: [
    bindEagerlyTo(WsServerToken)(webSocketServer),
  ],
  event$: (...args) => merge(
    listening$(...args),
    upgrade$(...args),
  ),
});

export const bootstrap = async () => {
  const app = await server;

  if (process.env.NODE_ENV !== 'test') app();
};

bootstrap();
