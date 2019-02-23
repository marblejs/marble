import { createServer, matchEvent, ServerEvent, HttpServerEffect, bindTo } from '@marblejs/core';
import { mapToServer } from '@marblejs/websockets';
import { merge } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { httpServer } from './http.listener';
import { webSocketServer } from './ws.listener';
import { WsServerToken } from './tokens';

const upgrade$: HttpServerEffect = (event$, _, { ask }) =>
  event$.pipe(
    matchEvent(ServerEvent.upgrade),
    mapToServer({
      path: '/api/:version/ws',
      server: ask(WsServerToken),
    }),
  );

const listen$: HttpServerEffect = event$ =>
  event$.pipe(
    matchEvent(ServerEvent.listen),
    map(event => event.payload),
    tap(({ port, host }) => console.log(`Server running @ http://${host}:${port}/ 🚀`)),
  );

export const server = createServer({
  hostname: '127.0.0.1',
  port: 1337,
  httpListener: httpServer,
  dependencies: [
    bindTo(WsServerToken)(webSocketServer({ noServer: true }).run),
  ],
  event$: (...args) => merge(
    listen$(...args),
    upgrade$(...args),
  ),
});
