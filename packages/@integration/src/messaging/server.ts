import { of } from 'rxjs';
import { map, tap, mergeMap, bufferCount, mapTo, catchError, delay } from 'rxjs/operators';
import { matchEvent, use, Event } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { createMicroservice, messagingListener, Transport, MsgEffect } from '@marblejs/messaging';
import { isTestEnv } from '@marblejs/core/dist/+internal/utils';
import { IO } from 'fp-ts/lib/IO';

const fib = (n: number): number =>
  (n === 0 || n === 1) ? n : fib(n - 1) + fib(n - 2);

const fibonacci$: MsgEffect = event$ => {

  return event$.pipe(
    matchEvent('FIB'),
    use(eventValidator$(t.number)),
    mergeMap(event => of(event).pipe(
      tap(event => { if (event.payload >= 45) throw new Error('Too high number!') }),
      map(event => fib(event.payload)),
      map(payload => ({ ...event, type: 'FIB_RESULT', payload } as Event)),
      catchError(error => of({ ...event, error: { name: error.name, message: error.message } } as Event)),
    )),
  );
};

const buffer$: MsgEffect = event$ => {

  return event$.pipe(
    matchEvent('BUFFER'),
    bufferCount(2),
    mapTo({ type: 'BUFFER_RESULT' }),
  );
};

const timeout$: MsgEffect = event$ => {

  return event$.pipe(
    matchEvent('TIMEOUT'),
    mergeMap(event => of(event).pipe(
      delay(180 * 1000),
      mapTo({ ...event, type: 'TIMEOUT_RESULT' } as Event),
    )),
  );
};

const error$: MsgEffect = event$ => {

  return event$.pipe(
    matchEvent('ERROR'),
    tap(() => { throw new Error('test_error'); }),
  );
};


export const microservice = createMicroservice({
  transport: Transport.AMQP,
  options: {
    host: 'amqp://localhost:5672',
    queue: 'test_queue',
    queueOptions: { durable: false },
  },
  messagingListener: messagingListener({
    effects: [fibonacci$, buffer$, timeout$, error$],
  }),
});

const main: IO<void> = async () =>
  !isTestEnv() && await (await microservice)();

main();
