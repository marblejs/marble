import { logger$ } from '@marblejs/middleware-logger';
import { messagingClient, MessagingClient, Transport } from '@marblejs/messaging';
import {
  r,
  bindTo,
  createServer,
  createContextToken,
  matchEvent,
  ServerEvent,
  httpListener,
  HttpServerEffect,
} from '@marblejs/core';
import { merge, of, forkJoin } from 'rxjs';
import { tap, map, mapTo, mergeMap } from 'rxjs/operators';

const ClientToken = createContextToken<MessagingClient>();

const client = messagingClient({
  transport: Transport.TCP,
  options: {
    host: 'amqp://localhost:5672',
    queue: 'test_queue',
    queueOptions: { durable: false },
  },
});

const fib$ = r.pipe(
  r.matchPath('/fib'),
  r.matchType('GET'),
  r.useEffect((req$, _, { ask }) => req$.pipe(
    mapTo(ask(ClientToken)),
    mergeMap(client => forkJoin(
      client.map(c => c.send({ type: 'FIB', payload: 42 })).getOrElse(of({})),
      client.map(c => c.send({ type: 'FIB', payload: 42 })).getOrElse(of({})),
    )),
    map(body => ({ body })),
  )),
);

const listening$: HttpServerEffect = event$ =>
  event$.pipe(
    matchEvent(ServerEvent.listening),
    map(event => event.payload),
    tap(({ port, host }) => console.log(`Server running @ http://${host}:${port}/ 🚀`)),
  );

export const server = createServer({
  port: 1337,
  httpListener: httpListener({
    middlewares: [logger$()],
    effects: [fib$],
  }),
  dependencies: [
    bindTo(ClientToken)(client.run),
  ],
  event$: (...args) => merge(
    listening$(...args),
  ),
});

server.run();
