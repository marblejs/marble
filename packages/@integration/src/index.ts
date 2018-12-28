import { marble, matchEvent, Event, ServerEffect, bind } from '@marblejs/core';
import { mapToServer } from '@marblejs/websockets';
import { of, concat } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { httpServer } from './http.listener';
import { webSocketServer } from './webSockets.listener';
import { WebSocketsToken } from './tokens';

const upgrade$: ServerEffect = (event$, _, injector) =>
  event$.pipe(
    matchEvent(Event.UPGRADE),
    mapToServer({
      path: '/api/:version/ws',
      server: WebSocketsToken,
    })(injector),
  );

const listen$: ServerEffect = event$ =>
  event$.pipe(
    matchEvent(Event.LISTEN),
    tap(([ port, hostname ]) =>
      console.log(`Server running @ http://${hostname}:${port}/ 🚀`)
    ),
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
