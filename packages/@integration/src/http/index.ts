import { createServer, matchEvent, ServerEvent, HttpServerEffect } from '@marblejs/core';
import { merge } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import httpListener from './http.listener';

const port = process.env.PORT
  ? Number(process.env.PORT)
  : undefined;

const listening$: HttpServerEffect = event$ =>
  event$.pipe(
    matchEvent(ServerEvent.listening),
    map(event => event.payload),
    tap(({ port, host }) => console.log(`Server running @ http://${host}:${port}/ 🚀`)),
  );

export const server = createServer({
  port,
  httpListener,
  event$: (...args) => merge(
    listening$(...args),
  ),
});

if (process.env.NODE_ENV !== 'test') {
  server();
}
