import { logger$ } from '@marblejs/middleware-logger';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { messagingClient, MessagingClient, Transport } from '@marblejs/messaging';
import { r, createServer, createContextToken, httpListener, use, useContext, bindEagerlyTo, combineRoutes, ContextToken } from '@marblejs/core';
import { isTestEnv, getPortEnv } from '@marblejs/core/dist/+internal/utils';
import { IO } from 'fp-ts/lib/IO';
import { forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

const AmqpClientToken = createContextToken<MessagingClient>('AmqpMessagingClient');
const RedisClientToken = createContextToken<MessagingClient>('RedisMessagingClient');

const amqpClient = messagingClient({
  transport: Transport.AMQP,
  options: {
    host: 'amqp://localhost:5672',
    queue: 'test_queue',
    queueOptions: { durable: false },
    timeout: isTestEnv() ? 500 : 30 * 1000,
  },
});

const redisClient = messagingClient({
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

const amqp$ = combineRoutes('/amqp', [
  fib$(AmqpClientToken),
]);

const redis$ = combineRoutes('/redis', [
  fib$(RedisClientToken),
]);

export const server = createServer({
  port: getPortEnv(),
  listener: httpListener({
    middlewares: [logger$()],
    effects: [amqp$, redis$],
  }),
  dependencies: [
    bindEagerlyTo(AmqpClientToken)(amqpClient),
    bindEagerlyTo(RedisClientToken)(redisClient),
  ],
});

const main: IO<void> = async () =>
  !isTestEnv() && await (await server)();

main();
