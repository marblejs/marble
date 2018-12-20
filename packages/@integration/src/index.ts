import { marble, matchHttpEvent, Event, EventTypeBase } from '@marblejs/core';
import { Observable, of, concat } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { app, ws } from './app';
import { mapToServer } from '../../websockets/src';

const upgrade$ = (event$: Observable<EventTypeBase>) =>
  event$.pipe(
    matchHttpEvent(Event.UPGRADE),
    mapToServer({
      pathToMatch: '/ws',
      server: ws(),
    }),
  );

const listen$ = (event$: Observable<EventTypeBase>) =>
  event$.pipe(
    matchHttpEvent(Event.LISTEN),
    tap(([ port, hostname ]) =>
      console.log`Server running @ http://${hostname}:${port}/`
    ),
  );

const events$ = (event$: Observable<EventTypeBase>) =>
  event$.pipe(
    mergeMap(event => concat(
      listen$(of(event)),
      upgrade$(of(event)),
    ),
  ));

marble({
  hostname: '127.0.0.1',
  port: 1337,
  httpListener: app,
  httpEventsHandler: events$,
});
