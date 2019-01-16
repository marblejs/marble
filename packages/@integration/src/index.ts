import { createServer, matchEvent, ServerEvent, ServerEffect, bind } from '@marblejs/core';
import { mapToServer } from '@marblejs/websockets';
import { merge } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { httpServer } from './http.listener';
import { webSocketServer } from './ws.listener';
import { WebSocketsToken } from './tokens';

const upgrade$: ServerEffect = (event$, _, { inject }) =>
  event$.pipe(
    matchEvent(ServerEvent.upgrade),
    mapToServer({
      path: '/api/:version/ws',
      server: inject(WebSocketsToken),
    }),
  );

const listen$: ServerEffect = event$ =>
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
    bind(WebSocketsToken).to(() => webSocketServer()),
  ],
  event$: (...args) => merge(
    listen$(...args),
    upgrade$(...args),
  ),
});
