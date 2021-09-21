import { logger$ } from '@marblejs/middleware-logger';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { MessagingClient, Transport } from '@marblejs/messaging';
import { createContextToken, useContext, bindEagerlyTo, ContextToken } from '@marblejs/core';
import { r, createServer, combineRoutes, httpListener } from '@marblejs/http';
import { isTestEnv, getPortEnv } from '@marblejs/core/dist/+internal/utils';
import * as T from 'fp-ts/lib/Task';
import { pipe } from 'fp-ts/lib/function';
import { forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

const AmqpClientToken = createContextToken<MessagingClient>('AmqpMessagingClient');
const RedisClientToken = createContextToken<MessagingClient>('RedisMessagingClient');

const AmqpClient = MessagingClient({
  transport: Transport.AMQP,
  options: {
    host: 'amqp://localhost:5672',
    queue: 'test_queue',
    queueOptions: { durable: false },
    timeout: isTestEnv() ? 500 : 30 * 1000,
  },
});

const RedisClient = MessagingClient({
  transport: Transport.REDIS,
  options: {
    host: 'redis://127.0.0.1:6379',
    channel: 'test_channel',
    timeout: isTestEnv() ? 500 : 30 * 1000,
  },
});

const rootValiadtor$ = requestValidator$({
  params: t.type({
    number: t.string,
  }),
});

const fib$ = (clientToken: ContextToken<MessagingClient>) => r.pipe(
  r.matchPath('/fib/:number'),
  r.matchType('GET'),
  r.useEffect((req$, ctx) => {
    const client = useContext(clientToken)(ctx.ask);

    return req$.pipe(
      rootValiadtor$,
      map(req => Number(req.params.number)),
      mergeMap(number => forkJoin([
        client.send({ type: 'FIB', payload: number + 0 }),
        client.send({ type: 'FIB', payload: number + 1 }),
        client.send({ type: 'FIB', payload: number + 2 }),
        client.send({ type: 'FIB', payload: number + 3 }),
        client.send({ type: 'FIB', payload: number + 4 }),
      ])),
      map(body => ({ body })),
    );
  }),
);

const amqp$ = combineRoutes('/amqp', [
  fib$(AmqpClientToken),
]);

const redis$ = combineRoutes('/redis', [
  fib$(RedisClientToken),
]);

export const dependencies = [
  bindEagerlyTo(AmqpClientToken)(AmqpClient),
  bindEagerlyTo(RedisClientToken)(RedisClient),
];

export const listener = httpListener({
  middlewares: [logger$()],
  effects: [amqp$, redis$],
});

export const server = () => createServer({
  port: getPortEnv(),
  listener,
  dependencies,
});

export const main = !isTestEnv()
  ? pipe(server, T.map(run => run()))
  : T.of(undefined);

main();
