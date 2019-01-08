import { marble, matchEvent, ServerEvent, ServerEffect, bind } from '@marblejs/core';
import { mapToServer } from '@marblejs/websockets';
import { of, concat } from 'rxjs';
import { mergeMap, tap, map } from 'rxjs/operators';
import { httpServer } from './http.listener';
import { webSocketServer } from './ws.listener';
import { WebSocketsToken } from './tokens';

const upgrade$: ServerEffect = (event$, _, injector) =>
  event$.pipe(
    matchEvent(ServerEvent.upgrade),
    mapToServer({
      path: '/api/:version/ws',
      server: WebSocketsToken,
    })(injector),
  );

const listen$: ServerEffect = event$ =>
  event$.pipe(
    matchEvent(ServerEvent.listen),
    map(event => event.payload),
    tap(({ port, host }) => console.log(`Server running @ http://${host}:${port}/ 🚀`)),
  );

const events$: ServerEffect = (event$, ...args) =>
  event$.pipe(
    mergeMap(event => concat(
      listen$(of(event), ...args),
      upgrade$(of(event), ...args),
    ),
  ));

export const marbleServer = marble({
  hostname: '127.0.0.1',
  port: 1337,
  httpListener: httpServer,
  httpEventsHandler: events$,
  dependencies: [
    bind(WebSocketsToken).to(() => webSocketServer()),
  ]
});
