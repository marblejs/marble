import { matchEvent, use, createContext } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { messagingListener, Transport, MsgEffect, MsgMiddlewareEffect } from '@marblejs/messaging';
import { map, tap } from 'rxjs/operators';

const fibonacci = (n: number): number =>
  n === 0 || n === 1
    ? n
    : fibonacci(n - 1) + fibonacci(n - 2);

const log$: MsgMiddlewareEffect = event$ =>
  event$.pipe(
    tap(event => console.log('server ::', event)),
  );

const fibonacci$: MsgEffect = event$ =>
  event$.pipe(
    matchEvent('FIB'),
    use(eventValidator$(t.number)),
    map(event => fibonacci(event.payload)),
    map(payload => ({ type: 'FIB_RESULT', payload })),
  );

const listener = messagingListener({
  effects: [
    fibonacci$,
  ],
  middlewares: [
    log$,
  ],
  transport: Transport.AMQP,
  options: {
    host: 'amqp://localhost:5672',
    queue: 'test_queue',
    queueOptions: { durable: false },
  },
});

export const server = listener();

if (process.env.NODE_ENV !== 'test') {
  server.run(createContext());
}
