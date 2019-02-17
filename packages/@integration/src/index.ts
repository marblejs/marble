import { createServer, matchEvent, ServerEvent, HttpServerEffect, bind } from '@marblejs/core';
import { mapToServer } from '@marblejs/websockets';
import { merge } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { httpServer } from './http.listener';
import { webSocketServer } from './ws.listener';
import { WebSocketServerToken } from './tokens';

const upgrade$: HttpServerEffect = (event$, _, { inject }) =>
  event$.pipe(
    matchEvent(ServerEvent.upgrade),
    mapToServer({
      path: '/api/:version/ws',
      server: inject(WebSocketServerToken),
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
    bind(WebSocketServerToken).to(webSocketServer({ noServer: true })),
  ],
  event$: (...args) => merge(
    listen$(...args),
    upgrade$(...args),
  ),
});
