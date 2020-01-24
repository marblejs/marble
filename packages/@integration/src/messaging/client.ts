import { logger$ } from '@marblejs/middleware-logger';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { messagingClient, MessagingClient, Transport } from '@marblejs/messaging';
import { r, createServer, createContextToken, httpListener, use, useContext, bindEagerlyTo } from '@marblejs/core';
import { isTestEnv } from '@marblejs/core/dist/+internal/utils';
import { IO } from 'fp-ts/lib/IO';
import { forkJoin } from 'rxjs';
import { map, mergeMap, mapTo } from 'rxjs/operators';

const port = process.env.PORT
  ? Number(process.env.PORT)
  : undefined;

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

const buffer$ = r.pipe(
  r.matchPath('/buffer'),
  r.matchType('GET'),
  r.useEffect((req$, { ask }) => {
    const client = useContext(ClientToken)(ask);

    return req$.pipe(
      mergeMap(() => client.emit({ type: 'BUFFER' })),
      mapTo(({ body: 'OK' })),
    );
  }),
);

const timeout$ = r.pipe(
  r.matchPath('/timeout'),
  r.matchType('GET'),
  r.useEffect((req$, { ask }) => {
    const client = useContext(ClientToken)(ask);

    return req$.pipe(
      mergeMap(() => client.send({ type: 'TIMEOUT' })),
      mapTo(({ body: 'OK' })),
    );
  }),
);

const error$ = r.pipe(
  r.matchPath('/error'),
  r.matchType('GET'),
  r.useEffect((req$, { ask }) => {
    const client = useContext(ClientToken)(ask);

    return req$.pipe(
      mergeMap(() => client.send({ type: 'ERROR' })),
      mapTo(({ body: 'OK' })),
    );
  }),
);

const fib$ = r.pipe(
  r.matchPath('/fib/:number'),
  r.matchType('GET'),
  r.useEffect((req$, ctx) => {
    const client = useContext(ClientToken)(ctx.ask);

    return req$.pipe(
      use(rootValiadtor$),
      map(req => Number(req.params.number)),
      mergeMap(number => forkJoin(
        client.send({ type: 'FIB', payload: number + 0 }),
        client.send({ type: 'FIB', payload: number + 1 }),
        client.send({ type: 'FIB', payload: number + 2 }),
        client.send({ type: 'FIB', payload: number + 3 }),
        client.send({ type: 'FIB', payload: number + 4 }),
      )),
      map(body => ({ body })),
    );
  }),
);

export const server = createServer({
  port,
  listener: httpListener({
    middlewares: [logger$()],
    effects: [buffer$, timeout$, error$, fib$],
  }),
  dependencies: [
    bindEagerlyTo(ClientToken)(client),
  ],
});

const main: IO<void> = async () =>
  !isTestEnv() && await (await server)();

main();
