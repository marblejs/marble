import { marble, matchEvent, Event, MarbleEvent } from '@marblejs/core';
import { Observable, of, concat } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { httpServer, webSocketServer } from './app';
import { mapToServer } from '../../websockets/src';

const upgrade$ = (event$: Observable<MarbleEvent>) =>
  event$.pipe(
    matchEvent(Event.UPGRADE),
    mapToServer({
      path: '/api/:version/ws',
      server: webSocketServer(),
    }),
  );

const listen$ = (event$: Observable<MarbleEvent>) =>
  event$.pipe(
    matchEvent(Event.LISTEN),
    tap(([ port, hostname ]) =>
      console.log(`Server running @ http://${hostname}:${port}/ 🚀`)
    ),
  );

const events$ = (event$: Observable<MarbleEvent>) =>
  event$.pipe(
    mergeMap(event => concat(
      listen$(of(event)),
      upgrade$(of(event)),
    ),
  ));

marble({
  hostname: '127.0.0.1',
  port: 1337,
  httpListener: httpServer,
  httpEventsHandler: events$,
});
