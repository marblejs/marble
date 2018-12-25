import { marble, matchEvent, Event, ServerEffect } from '@marblejs/core';
import { of, concat } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { httpServer, webSocketServer } from './app';
import { mapToServer } from '../../websockets/src';
import { AppDependencies } from './app.dependencies';

const upgrade$: ServerEffect = event$ =>
  event$.pipe(
    matchEvent(Event.UPGRADE),
    mapToServer({
      path: '/api/:version/ws',
      server: AppDependencies.WS_SERVER,
    }),
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

marble({
  hostname: '127.0.0.1',
  port: 1337,
  httpListener: httpServer,
  httpEventsHandler: events$,
  dependencies: {
    [AppDependencies.WS_SERVER]: () => webSocketServer(),
  },
});
