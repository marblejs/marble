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
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { merge, of, forkJoin, EMPTY, Observable } from 'rxjs';
import { tap, map, mergeMap } from 'rxjs/operators';
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
    mergeMap(() => pipe(
      ask(ClientToken),
      O.map(client => client.emit({ type: 'TEST' })),
      O.getOrElse(() => EMPTY as Observable<boolean>))),
    map(() => ({ body: 'OK' })),
  )),
);

const fib$ = r.pipe(
  r.matchPath('/fib/:number'),
  r.matchType('GET'),
  r.useEffect((req$, _, { ask }) => req$.pipe(
    use(rootValiadtor$),
    map(req => Number(req.params.number)),
    mergeMap(number => of(ask(ClientToken)).pipe(
      mergeMap(client => forkJoin(
        pipe(client, O.map(c => c.send({ type: 'FIB', payload: number + 0 })), O.getOrElse(() => of({} as unknown))),
        pipe(client, O.map(c => c.send({ type: 'FIB', payload: number + 1 })), O.getOrElse(() => of({} as unknown))),
        pipe(client, O.map(c => c.send({ type: 'FIB', payload: number + 2 })), O.getOrElse(() => of({} as unknown))),
        pipe(client, O.map(c => c.send({ type: 'FIB', payload: number + 3 })), O.getOrElse(() => of({} as unknown))),
        pipe(client, O.map(c => c.send({ type: 'FIB', payload: number + 4 })), O.getOrElse(() => of({} as unknown))),
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
    effects: [test$, fib$],
  }),
  dependencies: [
    bindTo(ClientToken)(client),
  ],
  event$: (...args) => merge(
    listening$(...args),
  ),
});

server.run(
  process.env.NODE_ENV !== 'test'
);
