import { matchEvent, use } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';
import {
  createMicroservice,
  messagingListener,
  status$,
  output$,
  input$,
  Transport,
  MsgEffect,
  MsgServerEffect,
  ServerEvent,
} from '@marblejs/messaging';
import { merge } from 'rxjs';
import { map, tap } from 'rxjs/operators';

const fibonacci = (n: number): number =>
  n === 0 || n === 1
    ? n
    : fibonacci(n - 1) + fibonacci(n - 2);

const fibonacci$: MsgEffect = event$ =>
  event$.pipe(
    matchEvent('FIB'),
    use(eventValidator$(t.number)),
    map(event => fibonacci(event.payload)),
    map(payload => ({ type: 'FIB_RESULT', payload })),
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
    middlewares: [input$()],
    output$: output$(),
  }),
  dependencies: [],
  event$: (...args) => merge(
    error$(...args),
    status$()(...args),
  ),
});

const bootstrap = async () => {
  await microservice();
};

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}
