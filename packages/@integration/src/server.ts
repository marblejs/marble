import { createServer, matchEvent, ServerEvent, HttpServerEffect, bindTo } from '@marblejs/core';
import { mapToServer } from '@marblejs/websockets';
import { merge } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { WsServerToken } from './tokens';
import httpListener from './http.listener';
import webSocketListener from './ws.listener';

const upgrade$: HttpServerEffect = (event$, _, { ask }) =>
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

export default createServer({
  port: 1337,
  httpListener,
  dependencies: [
    bindTo(WsServerToken)(webSocketListener().run),
  ],
  event$: (...args) => merge(
    listening$(...args),
    upgrade$(...args),
  ),
});
