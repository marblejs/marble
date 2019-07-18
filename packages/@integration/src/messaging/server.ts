import { matchEvent, use } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';
import {
  createMicroservice,
  messagingListener,
  Transport,
  MsgEffect,
  MsgMiddlewareEffect,
  MsgServerEffect,
  ServerEvent,
} from '@marblejs/messaging';
import { merge } from 'rxjs';
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

const listening$: MsgServerEffect = event$ =>
  event$.pipe(
    matchEvent(ServerEvent.listening),
    map(event => event.payload),
    tap(({ host, channel }) => console.log(`Server running @ ${host} for queue "${channel}" 🚀`)),
  );

const error$: MsgServerEffect = event$ =>
  event$.pipe(
    matchEvent(ServerEvent.error),
    map(event => event.payload),
    tap(({ error }) => console.error(error)),
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
    middlewares: [log$],
  }),
  dependencies: [],
  event$: (...args) => merge(
    listening$(...args),
    error$(...args),
  ),
});

if (process.env.NODE_ENV !== 'test') {
  microservice.run();
}
