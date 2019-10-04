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
  useContext,
} from '@marblejs/core';
import { merge, forkJoin } from 'rxjs';
import { tap, map, mergeMap, mapTo } from 'rxjs/operators';
import { requestValidator$, t } from '@marblejs/middleware-io';

const ClientToken = createContextToken<MessagingClient>('MessagingClient');

const client = messagingClient({
  transport: Transport.AMQP,
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

const test$ = r.pipe(
  r.matchPath('/test'),
  r.matchType('GET'),
  r.useEffect((req$, _, { ask }) => req$.pipe(
    mergeMap(() => useContext(ClientToken)(ask).emit({ type: 'TEST' })),
    mapTo(({ body: 'OK' })),
  )),
);

const fib$ = r.pipe(
  r.matchPath('/fib/:number'),
  r.matchType('GET'),
  r.useEffect((req$, _, { ask }) => req$.pipe(
    use(rootValiadtor$),
    map(req => Number(req.params.number)),
    mergeMap(number => {
      const client = useContext(ClientToken)(ask);

      return forkJoin(
        client.send({ type: 'FIB', payload: number + 0 }),
        client.send({ type: 'FIB', payload: number + 1 }),
        client.send({ type: 'FIB', payload: number + 2 }),
        client.send({ type: 'FIB', payload: number + 3 }),
        client.send({ type: 'FIB', payload: number + 4 }),
      );
    }),
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
    effects: [test$, fib$],
  }),
  dependencies: [
    bindTo(ClientToken)(client),
  ],
  event$: (...args) => merge(
    listening$(...args),
  ),
});

if (process.env.NODE_ENV !== 'test') {
  server();
}
