import { Event, matchEvent, use, EventError, createEvent } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { map, tap, mergeMapTo } from 'rxjs/operators';
import { createMicroservice } from './messaging.server';
import { messagingListener } from './messaging.server.listener';
import { Transport, TransportMessage } from '../transport/transport.interface';
import { createAmqpStrategy } from '../transport/strategies/amqp.strategy';
import { MsgEffect, MsgErrorEffect } from '../effects/messaging.effects.interface';
import { Subject, throwError } from 'rxjs';
import { AmqpStrategyOptions } from '../transport/strategies/amqp.strategy.interface';

describe('messagingServer', () => {

  describe('AMQP', () => {
    const createOptions = (config: { expectAck?: boolean; queue?: string } = {}): AmqpStrategyOptions => ({
      host: 'amqp://localhost:5672',
      queue: config.queue || 'test_queue_server',
      expectAck: config.expectAck,
      queueOptions: { durable: false },
    });

    const runServer = (options: AmqpStrategyOptions) => (effect$?: MsgEffect, error$?: MsgErrorEffect) =>
      createMicroservice({
        options,
        transport: Transport.AMQP,
        messagingListener: messagingListener(effect$ ? { effects: [effect$], error$ } : undefined),
      })();

    const runClient = (options: AmqpStrategyOptions) =>
      createAmqpStrategy(options).connect({ isConsumer: false });

    const createMessage = (data: any): TransportMessage<Buffer> => ({
      data: Buffer.from(JSON.stringify(data)),
    });

    test('handles RPC event', async () => {
      const rpc$: MsgEffect = event$ =>
        event$.pipe(
          matchEvent('RPC_TEST'),
          use(eventValidator$(t.number)),
          map(event => event.payload),
          map(payload => ({ type: 'RPC_TEST_RESULT', payload: payload + 1 })),
        );

      const options = createOptions({ expectAck: false });
      const client = await runClient(options);
      const server = await runServer(options)(rpc$);
      const message = createMessage({ type: 'RPC_TEST', payload: 1 });

      const result = await client.sendMessage(options.queue, message);
      const parsedResult = JSON.parse(result.data.toString());

      expect(parsedResult).toEqual({ type: 'RPC_TEST_RESULT', payload: 2 });

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
      const client = await runClient(options);
      const server = await runServer(options)(event$);
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
      const client = await runClient(options);
      const server = await runServer(options)(event$);
      const message = createMessage({ type: 'EVENT_TEST', payload: 1 });

      await client.emitMessage(options.queue, message);
    });

    test('reacts to thrown Error', async done => {
      const event = { type: 'EVENT_TEST' };
      const error = new Error('test_error');
      const errorSubject = new Subject<[Event | undefined, Error]>();

      errorSubject.subscribe(data => {
        expect(data[0]).toBeUndefined();
        expect(data[1]).toEqual(error);
        setTimeout(() => server.close().then(done), 1000);
      });

      const event$: MsgEffect = event$ =>
        event$.pipe(
          matchEvent('EVENT_TEST'),
          mergeMapTo(throwError(error)),
        );

      const error$: MsgErrorEffect = event$ =>
        event$.pipe(
          tap(({ event, error }) => errorSubject.next([event, error])),
          map(() => createEvent('ERROR')),
        );

      const options = createOptions({ expectAck: false });
      const client = await runClient(options);
      const server = await runServer(options)(event$, error$);

      const emitResult = await client.emitMessage(options.queue, createMessage(event));

      expect(emitResult).toEqual(true);
    });

    test('reacts to thrown EventError', async done => {
      const event = { type: 'EVENT_TEST' };
      const error = new EventError(event, 'test_error');
      const errorSubject = new Subject<[Event | undefined, Error]>();

      errorSubject.subscribe(data => {
        expect(data[0]).toEqual(event);
        expect(data[1]).toEqual(error);
        setTimeout(() => server.close().then(done), 1000);
      });

      const event$: MsgEffect = event$ =>
        event$.pipe(
          matchEvent('EVENT_TEST'),
          mergeMapTo(throwError(error)),
        );

      const error$: MsgErrorEffect = event$ =>
        event$.pipe(
          tap(({ event, error }) => errorSubject.next([event, error])),
          map(() => createEvent('ERROR')),
        );

      const options = createOptions({ expectAck: false });
      const client = await runClient(options);
      const server = await runServer(options)(event$, error$);

      const emitResult = await client.emitMessage(options.queue, createMessage(event));

      expect(emitResult).toEqual(true);
    });
  });

});
