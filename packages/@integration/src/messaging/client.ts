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
  use,
} from '@marblejs/core';
import { merge, of, forkJoin } from 'rxjs';
import { tap, map, mergeMap } from 'rxjs/operators';
import { requestValidator$, t } from '@marblejs/middleware-io';

const ClientToken = createContextToken<MessagingClient>();

const client = messagingClient({
  transport: Transport.TCP,
  options: {
    host: 'amqp://localhost:5672',
    queue: 'test_queue',
    queueOptions: { durable: false },
  },
});

const rootValiadtor$ = requestValidator$({
  params: t.type({
    number: t.string,
  }),
});

const fib$ = r.pipe(
  r.matchPath('/fib/:number'),
  r.matchType('GET'),
  r.useEffect((req$, _, { ask }) => req$.pipe(
    use(rootValiadtor$),
    map(req => Number(req.params.number)),
    mergeMap(number => of(ask(ClientToken)).pipe(
      mergeMap(client => forkJoin(
        client.map(c => c.send({ type: 'FIB', payload: number + 0 })).getOrElse(of({})),
        client.map(c => c.send({ type: 'FIB', payload: number + 1 })).getOrElse(of({})),
        client.map(c => c.send({ type: 'FIB', payload: number + 2 })).getOrElse(of({})),
        client.map(c => c.send({ type: 'FIB', payload: number + 3 })).getOrElse(of({})),
        client.map(c => c.send({ type: 'FIB', payload: number + 4 })).getOrElse(of({})),
      )),
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
  port: Number(process.env.PORT) || 1337,
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

server.run(
  process.env.NODE_ENV !== 'test'
);
