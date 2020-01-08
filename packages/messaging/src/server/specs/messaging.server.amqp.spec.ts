import { Event, matchEvent, use, combineEffects } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { Subject, throwError } from 'rxjs';
import { map, tap, mergeMapTo, delay, bufferCount } from 'rxjs/operators';
import { Transport } from '../../transport/transport.interface';
import { MsgEffect, MsgErrorEffect, MsgOutputEffect } from '../../effects/messaging.effects.interface';
import { AmqpStrategyOptions } from '../../transport/strategies/amqp.strategy.interface';
import { runClient, runServer, createMessage } from '../../util/messaging.test.util';

const createOptions = (config: { expectAck?: boolean; queue?: string } = {}): AmqpStrategyOptions => ({
  host: 'amqp://localhost:5672',
  queue: config.queue || 'test_queue_server',
  expectAck: config.expectAck,
  queueOptions: { durable: false },
});

describe.only('messagingServer::AMQP', () => {
  test('handles RPC event', async () => {
    const rpc$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        delay(250),
        use(eventValidator$(t.number)),
        map(event => event.payload),
        map(payload => ({ type: 'RPC_TEST_RESULT', payload: payload + 1 })),
      );

    const options = createOptions({ expectAck: false });
    const client = await runClient(Transport.AMQP, options);
    const server = await runServer(Transport.AMQP, options)(rpc$);

    const result = await Promise.all([
      client.sendMessage(options.queue, createMessage({ type: 'RPC_TEST', payload: 1 })),
      client.sendMessage(options.queue, createMessage({ type: 'RPC_TEST', payload: 10 })),
    ]);

    const parsedResult0 = JSON.parse(result[0].data.toString());
    const parsedResult1 = JSON.parse(result[1].data.toString());

    expect(parsedResult0).toEqual({ type: 'RPC_TEST_RESULT', payload: 2 });
    expect(parsedResult1).toEqual({ type: 'RPC_TEST_RESULT', payload: 11 });

    await server.close();
  });

  test('handles published event', async done => {
    const eventSubject = new Subject();

    eventSubject.subscribe(event => {
      expect(event).toEqual({ type: 'EVENT_TEST_RESPONSE', payload: 2 });
      setTimeout(() => server.close().then(done), 1000);
    });

    const event$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('EVENT_TEST'),
        use(eventValidator$(t.number)),
        map(event => event.payload),
        map(payload => ({ type: 'EVENT_TEST_RESPONSE', payload: payload + 1 })),
        tap(event => eventSubject.next(event)),
      );

    const options = createOptions({ expectAck: false });
    const client = await runClient(Transport.AMQP, options);
    const server = await runServer(Transport.AMQP, options)(event$);
    const message = createMessage({ type: 'EVENT_TEST', payload: 1 });

    const emitResult = await client.emitMessage(options.queue, message);

    expect(emitResult).toEqual(true);
  });

  test('acks processed event', async done => {
    const eventSubject = new Subject();

    eventSubject.subscribe(event => {
      expect(event).toEqual({ type: 'EVENT_TEST_RESPONSE', payload: 2 });
      setTimeout(() => server.close().then(done), 1000);
    });

    const event$: MsgEffect = (event$, { client }) =>
      event$.pipe(
        matchEvent('EVENT_TEST'),
        use(eventValidator$(t.number)),
        map(event => {
          client.ackMessage(event.raw);
          return { type: 'EVENT_TEST_RESPONSE', payload: event.payload + 1 };
        }),
        tap(event => eventSubject.next(event)),
      );

    const options = createOptions({ expectAck: true, queue: 'test_ack_queue_server' });
    const client = await runClient(Transport.AMQP, options);
    const server = await runServer(Transport.AMQP, options)(event$);
    const message = createMessage({ type: 'EVENT_TEST', payload: 1 });

    await client.emitMessage(options.queue, message);
  });

  test.only('reacts to thrown Error and doesn\'t crash internal messages stream', async done => {
    const event1: Event = { type: 'EVENT_TEST_1' };
    const event2: Event = { type: 'EVENT_TEST_2' };
    const error = new Error('test_error');
    const outputSubject = new Subject<[Event, Error | undefined]>();

    outputSubject
      .pipe(bufferCount(2))
      .subscribe(data => {
        expect(data[0][0].type).toEqual(event1.type);
        expect(data[0][1]).toEqual(error);
        expect(data[1][0].type).toEqual(event2.type);
        expect(data[1][1]).toBeUndefined();
        setTimeout(() => server.close().then(done), 1000);
      });

    const event1$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent(event1.type),
        mergeMapTo(throwError(error)),
      );

    const event2$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent(event2.type),
      );

    const error$: MsgErrorEffect = event$ =>
      event$.pipe(
        tap(({ event, error }) => outputSubject.next([event, error])),
        map(({ event }) => event),
      );

    const output$: MsgOutputEffect = event$ =>
      event$.pipe(
        tap(({ event }) => outputSubject.next([event, undefined])),
        map(({ event }) => event),
      );

    const options = createOptions({ expectAck: false });
    const client = await runClient(Transport.AMQP, options);
    const server = await runServer(Transport.AMQP, options)(combineEffects(event1$, event2$), output$, error$);

    await client.emitMessage(options.queue, createMessage(event1));
    await client.emitMessage(options.queue, createMessage(event2));
  });
});
