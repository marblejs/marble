import { of } from 'rxjs';
import { map, tap, mergeMap, bufferCount, mapTo, catchError } from 'rxjs/operators';
import { matchEvent, use, Event } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { createMicroservice, messagingListener, Transport, MsgEffect } from '@marblejs/messaging';

const fib = (n: number): number =>
  (n === 0 || n === 1) ? n : fib(n - 1) + fib(n - 2);

const fibonacci$: MsgEffect = event$ =>
  event$.pipe(
    matchEvent('FIB'),
    use(eventValidator$(t.number)),
    mergeMap(event => of(event).pipe(
      tap(event => { if (event.payload >= 45) throw new Error('Too high number!') }),
      map(event => fib(event.payload)),
      map(payload => ({ ...event, type: 'FIB_RESULT', payload } as Event)),
      catchError(error => of({ ...event, error: { name: error.name, message: error.message } } as Event)),
    )),
  );

const test$: MsgEffect = event$ =>
  event$.pipe(
    matchEvent('TEST'),
    bufferCount(2),
    mapTo({ type: 'TEST_RESULT' }),
  );

export const microservice = createMicroservice({
  transport: Transport.AMQP,
  options: {
    host: 'amqp://localhost:5672',
    queue: 'test_queue',
    queueOptions: { durable: false },
  },
  messagingListener: messagingListener({
    effects: [fibonacci$, test$],
  }),
});

export const bootstrap = async () => {
  const app = await microservice;

  if (process.env.NODE_ENV !== 'test') app();
};

bootstrap();
