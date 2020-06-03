import { Event, matchEvent, use, combineEffects } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { Subject, throwError } from 'rxjs';
import { map, tap, delay, bufferCount, mergeMap, mapTo } from 'rxjs/operators';
import { Transport } from '../../transport/transport.interface';
import { MsgEffect, MsgErrorEffect, MsgOutputEffect } from '../../effects/messaging.effects.interface';
import { AmqpStrategyOptions } from '../../transport/strategies/amqp.strategy.interface';
import { runMicroserviceClient, runMicroservice, createMessage } from '../../util/messaging.test.util';

const createOptions = (config: { expectAck?: boolean; queue?: string } = {}): AmqpStrategyOptions => ({
  host: 'amqp://localhost:5672',
  queue: config.queue || 'test_queue_server',
  expectAck: config.expectAck,
  queueOptions: { durable: false },
  timeout: 500,
});

describe('messagingServer::AMQP', () => {
  test('handles RPC event', async () => {
    const rpc$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        delay(50),
        use(eventValidator$(t.number)),
        map(event => ({ ...event, type: 'RPC_TEST_RESULT', payload: event.payload + 1 })),
      );

    const options = createOptions({ expectAck: false });
    const client = await runMicroserviceClient(Transport.AMQP, options);
    const microservice = await runMicroservice(Transport.AMQP, options)(rpc$);

    const result = await Promise.all([
      client.sendMessage(options.queue, createMessage({ type: 'RPC_TEST', payload: 1 })),
      client.sendMessage(options.queue, createMessage({ type: 'RPC_TEST', payload: 10 })),
    ]);

    const parsedResult0 = JSON.parse(result[0].data.toString());
    const parsedResult1 = JSON.parse(result[1].data.toString());

    expect(parsedResult0).toEqual({ type: 'RPC_TEST_RESULT', payload: 2 });
    expect(parsedResult1).toEqual({ type: 'RPC_TEST_RESULT', payload: 11 });

    await microservice.close();
    await client.close();
  });

  test('handles published event', async done => {
    const eventSubject = new Subject();

    eventSubject.subscribe(event => {
      expect(event).toEqual({ type: 'EVENT_TEST_RESPONSE', payload: 2 });
      setTimeout(async () => {
        await microservice.close();
        await client.close();
        done();
      }, 1000);
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
    const client = await runMicroserviceClient(Transport.AMQP, options);
    const microservice = await runMicroservice(Transport.AMQP, options)(event$);
    const message = createMessage({ type: 'EVENT_TEST', payload: 1 });

    await client.emitMessage(options.queue, message);
  });

  test('acks processed event', async done => {
    const eventSubject = new Subject();

    eventSubject.subscribe(event => {
      expect(event).toEqual({ type: 'EVENT_TEST_RESPONSE', payload: 2 });
      setTimeout(async () => {
        await consumer.close();
        await client.close();
        done();
      }, 1000);
    });

    const event$: MsgEffect = (event$, { client }) =>
      event$.pipe(
        matchEvent('EVENT_TEST'),
        use(eventValidator$(t.number)),
        map(event => {
          client.ackMessage(event.metadata?.raw);
          return { type: 'EVENT_TEST_RESPONSE', payload: event.payload + 1 };
        }),
        tap(event => eventSubject.next(event)),
      );

    const optionsClient = createOptions({ queue: 'test_ack_queue_server' });
    const optionsConsumer = createOptions({ expectAck: true, queue: 'test_ack_queue_server' });
    const client = await runMicroserviceClient(Transport.AMQP, optionsClient);
    const consumer = await runMicroservice(Transport.AMQP, optionsConsumer)(event$);
    const message = createMessage({ type: 'EVENT_TEST', payload: 1 });

    await client.emitMessage(optionsClient.queue, message);
  });

  test('reacts to thrown Error and doesn\'t crash internal messages stream', async done => {
    const event1: Event = { type: 'EVENT_TEST_1' };
    const event2: Event = { type: 'EVENT_TEST_2' };
    const event2Outgoing: Event = { type: `${event2.type}__processed` };
    const error = new Error('test_error');
    const outputSubject = new Subject<[Event | undefined, Error | undefined]>();

    outputSubject
      .pipe(bufferCount(2))
      .subscribe(data => {
        expect(data[0][0]).toBeUndefined();
        expect(data[0][1]).toEqual(error);
        expect(data[1][0]).toEqual(event2Outgoing);
        expect(data[1][1]).toBeUndefined();
        setTimeout(async () => {
          await microservice.close();
          await client.close();
          done();
        }, 1000);
      });

    const event1$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent(event1.type),
        mergeMap(() => throwError(error)),
      );

    const event2$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent(event2.type),
        mapTo(event2Outgoing),
      );

    const error$: MsgErrorEffect = event$ =>
      event$.pipe(
        tap(error => outputSubject.next([undefined, error])),
        map(() => ({ type: 'UNHANDLED' })),
      );

    const output$: MsgOutputEffect = event$ =>
      event$.pipe(
        tap((event => outputSubject.next([event, undefined]))),
      );

    const options = createOptions({ expectAck: false });
    const client = await runMicroserviceClient(Transport.AMQP, options);
    const microservice = await runMicroservice(Transport.AMQP, options)(combineEffects(event1$, event2$), output$, error$);

    await client.emitMessage(options.queue, createMessage(event1));
    await client.emitMessage(options.queue, createMessage(event2));
  });
});
