import { marble, HttpEvent } from '@marblejs/core';
import { app, ws } from './app';
import { mergeMap, filter, tap, map } from 'rxjs/operators';
import { Observable, of, concat } from 'rxjs';

const wsServer = ws();

const upgrade$ = (event$: Observable<HttpEvent>) => event$.pipe(
  filter(event => event.type === 'upgrade'),
  map(event => event.data),
  tap(([req, socket, head]) => {
    const pathname = req.url!;

    if (pathname.includes('/ws')) {
      wsServer.handleUpgrade(req, socket, head, function done(ws) {
        wsServer.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  })
);

const listen$ = (event$: Observable<HttpEvent>) => event$.pipe(
  filter(event => event.type === 'listen'),
  map(event => event.data),
  tap(([ port, hostname ]) => console.log(`Server running @ http://${hostname}:${port}/`)),
);

marble({
  hostname: '127.0.0.1',
  port: 1337,
  httpListener: app,
  httpEventsHandler: events$ => events$.pipe(
    mergeMap(event => concat(
      listen$(of(event)),
      upgrade$(of(event)),
    ),
  )),
});
