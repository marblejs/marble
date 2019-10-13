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
  MsgOutputEffect,
  AmqpConnectionStatus,
} from '@marblejs/messaging';
import { merge } from 'rxjs';
import { map, tap, filter, distinctUntilChanged } from 'rxjs/operators';

const log = (tag: string) => (data: any) =>
  console.log(tag, data);

const fibonacci = (n: number): number =>
  n === 0 || n === 1
    ? n
    : fibonacci(n - 1) + fibonacci(n - 2);

const log$: MsgMiddlewareEffect = event$ =>
  event$.pipe(
    tap(({ type, payload }) => log('INPUT')({ type, payload })),
  );

const fibonacci$: MsgEffect = event$ =>
  event$.pipe(
    matchEvent('FIB'),
    use(eventValidator$(t.number)),
    map(event => fibonacci(event.payload)),
    map(payload => ({ type: 'FIB_RESULT', payload })),
  );

const connect$: MsgServerEffect = event$ =>
  event$.pipe(
    matchEvent(ServerEvent.status),
    map(event => event.payload),
    distinctUntilChanged((p, c) => p.type === c.type),
    filter(({ type }) => type === AmqpConnectionStatus.CONNECTED),
    tap(({ host, channel }) => console.log(`🚀 Connected consumer @ ${host} for queue "${channel}"`)),
  );

const disconnect$: MsgServerEffect = event$ =>
  event$.pipe(
    matchEvent(ServerEvent.status),
    map(event => event.payload),
    distinctUntilChanged((p, c) => p.type === c.type),
    filter(({ type }) => type === AmqpConnectionStatus.CONNECTION_LOST),
    tap(({ host, channel }) => console.error(`💩 Cannot connect consumer @ ${host} for queue "${channel}"`)),
  );

const error$: MsgServerEffect = event$ =>
  event$.pipe(
    matchEvent(ServerEvent.error),
    map(event => event.payload),
    tap(({ error }) => console.error(error)),
  );

const output$: MsgOutputEffect = event$ =>
  event$.pipe(
    tap(({ event, initiator }) => log('OUTPUT')({
      event: event.type,
      payload: event.payload,
      replyTo: initiator.replyTo,
      correlationId: initiator.correlationId,
    })),
    map(({ event }) => event),
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
    output$,
  }),
  dependencies: [],
  event$: (...args) => merge(
    connect$(...args),
    disconnect$(...args),
    error$(...args),
  ),
});

if (process.env.NODE_ENV !== 'test') {
  microservice();
}
