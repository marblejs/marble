import { of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { matchEvent, act } from '@marblejs/core';
import { isTestEnv } from '@marblejs/core/dist/+internal/utils';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { createMicroservice, messagingListener, Transport, MsgEffect, reply } from '@marblejs/messaging';
import { IO } from 'fp-ts/lib/IO';
import { pipe } from 'fp-ts/lib/function';

const fib = (n: number): number =>
  (n === 0 || n === 1) ? n : fib(n - 1) + fib(n - 2);

const fibonacci$: MsgEffect = event$ =>
  event$.pipe(
    matchEvent('FIB'),
    act(event => pipe(
      eventValidator$(t.number)(event),
      tap(event => { if (event.payload >= 45) throw new Error('Too high number!'); }),
      map(event => fib(event.payload)),
      map(payload => reply(event)({ type: 'FIB_RESULT', payload })),
      catchError(error => of(reply(event)({ type: 'FIB_ERROR', error: { name: error.name, message: error.message } }))),
    )),
  );

export const amqpMicroservice = createMicroservice({
  transport: Transport.AMQP,
  options: {
    host: 'amqp://localhost:5672',
    queue: 'test_queue',
    queueOptions: { durable: false },
    timeout: isTestEnv() ? 500 : 30 * 1000
  },
  listener: messagingListener({
    effects: [fibonacci$],
  }),
});

export const redisMicroservice = createMicroservice({
  transport: Transport.REDIS,
  options: {
    host: 'redis://127.0.0.1:6379',
    channel: 'test_channel',
    timeout: isTestEnv() ? 500 : 30 * 1000
  },
  listener: messagingListener({
    effects: [fibonacci$],
  }),
});

const main: IO<void> = async () =>
  !isTestEnv() && await Promise.all([
    (await amqpMicroservice)(),
    (await redisMicroservice)(),
  ]);

main();
