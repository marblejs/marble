import { Event, matchEvent, use } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { map, tap, mergeMapTo } from 'rxjs/operators';
import { createMicroservice } from './messaging.server';
import { messagingListener } from './messaging.server.listener';
import { Transport, TransportMessage } from '../transport/transport.interface';
import { createAmqpStrategy } from '../transport/strategies/amqp.strategy';
import { MsgEffect, MsgErrorEffect } from '../effects/messaging.effects.interface';
import { Subject, throwError } from 'rxjs';

describe('messagingServer', () => {

  describe('AMQP', () => {
    const options = {
      host: 'amqp://localhost:5672',
      queue: 'test_queue_server',
      queueOptions: { durable: false },
    };

    const runServer = (effect$?: MsgEffect, error$?: MsgErrorEffect) =>
      createMicroservice({
        options,
        transport: Transport.AMQP,
        messagingListener: messagingListener(effect$ ? { effects: [effect$], error$ } : undefined),
      })();

    const runClient = () =>
      createAmqpStrategy(options).connect({ isConsumer: false });

    const createMessage = (data: any): TransportMessage<Buffer> => ({
      data: Buffer.from(JSON.stringify(data)),
    });

    test('receives RPC response from consumer', async () => {
      const rpc$: MsgEffect = event$ =>
        event$.pipe(
          matchEvent('RPC_TEST'),
          use(eventValidator$(t.number)),
          map(event => event.payload),
          map(payload => ({ type: 'RPC_TEST_RESULT', payload: payload + 1 })),
        );

      const client = await runClient();
      const server = await runServer(rpc$);
      const message = createMessage({ type: 'RPC_TEST', payload: 1 });

      const result = await client.sendMessage(options.queue, message);
      const parsedResult = JSON.parse(result.data.toString());

      expect(parsedResult).toEqual({ type: 'RPC_TEST_RESULT', payload: 2 });

      await server.close();
    });

    test('emits event to consumer', async done => {
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

      const server = await runServer(event$);
      const client = await runClient();
      const message = createMessage({ type: 'EVENT_TEST', payload: 1 });

      const emitResult = await client.emitMessage(options.queue, message);

      expect(emitResult).toEqual(true);
    });

    test('reacts to thrown error', async done => {
      const expectedMessage = { type: 'EVENT_TEST' };
      const expectedError = new Error('test_error');
      const errorSubject = new Subject<[Event, Error | undefined]>();

      errorSubject.subscribe(data => {
        expect(data[0]).toEqual(expectedMessage);
        expect(data[1]).toEqual(expectedError);
        setTimeout(() => server.close().then(done), 1000);
      });

      const event$: MsgEffect = event$ =>
        event$.pipe(
          matchEvent('EVENT_TEST'),
          mergeMapTo(throwError(expectedError)),
        );

      const error$: MsgErrorEffect = (event$, _, { error }) =>
        event$.pipe(
          tap(e => errorSubject.next([e, error])),
        );

      const server = await runServer(event$, error$);
      const client = await runClient();

      const emitResult = await client.emitMessage(options.queue, createMessage(expectedMessage));

      expect(emitResult).toEqual(true);
    });
  });

});
