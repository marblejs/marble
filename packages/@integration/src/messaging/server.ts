import { matchEvent, use } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { createMicroservice, messagingListener, Transport, MsgEffect } from '@marblejs/messaging';
import { map, tap } from 'rxjs/operators';

const fib = (n: number): number =>
  (n === 0 || n === 1) ? n : fib(n - 1) + fib(n - 2);

const fibonacci$: MsgEffect = event$ =>
  event$.pipe(
    matchEvent('FIB'),
    use(eventValidator$(t.number)),
    tap(event => { if (event.payload >= 45) throw new Error('Too high number!') }),
    map(event => fib(event.payload)),
    map(payload => ({ type: 'FIB_RESULT', payload })),
  );

export const microservice = createMicroservice({
  transport: Transport.AMQP,
  options: {
    host: 'amqp://localhost:5672',
    queue: 'test_queue',
    queueOptions: { durable: false },
  },
  messagingListener: messagingListener({
    effects: [fibonacci$],
  }),
});

export const bootstrap = async () => {
  const app = await microservice;

  if (process.env.NODE_ENV !== 'test') app();
};

bootstrap();
