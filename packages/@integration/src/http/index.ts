import { createServer, matchEvent, ServerEvent, HttpServerEffect } from '@marblejs/core';
import { merge } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import httpListener from './http.listener';

const listening$: HttpServerEffect = event$ =>
  event$.pipe(
    matchEvent(ServerEvent.listening),
    map(event => event.payload),
    tap(({ port, host }) => console.log(`Server running @ http://${host}:${port}/ 🚀`)),
  );

export const server = createServer({
  port: 1337,
  httpListener,
  event$: (...args) => merge(
    listening$(...args),
  ),
});

server.run(
  process.env.NODE_ENV !== 'test'
);
