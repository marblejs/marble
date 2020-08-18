import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { createContext, contextFactory, bindEagerlyTo, bindTo, register } from '@marblejs/core';
import { EventBusToken, eventBus } from '../eventbus/messaging.eventBus.reader';
import { messagingListener } from '../server/messaging.server.listener';
import { provideTransportLayer } from './transport.provider';
import { Transport } from './transport.interface';

describe('#provideTransportLayer', () => {
  test('provides AMQP transport layer', () => {
    pipe(
      createContext(),
      provideTransportLayer(Transport.AMQP),
      E.fold(fail, transportLayer => expect(transportLayer.type).toEqual(Transport.AMQP)),
    );
  });

  test('provides REDIS transport layer', () => {
    pipe(
      createContext(),
      provideTransportLayer(Transport.REDIS),
      E.fold(fail, transportLayer => expect(transportLayer.type).toEqual(Transport.REDIS)),
    );
  });

  test('provides LOCAL (EventBus) transport layer', async () => {
    pipe(
      await contextFactory(bindEagerlyTo(EventBusToken)(eventBus({ listener: messagingListener() }))),
      provideTransportLayer(Transport.LOCAL),
      E.fold(fail, transportLayer => expect(transportLayer.type).toEqual(Transport.LOCAL)),
    );
  });

  test('returns error if EventBus is not registered in the context', () => {
    pipe(
      createContext(),
      provideTransportLayer(Transport.LOCAL),
      E.fold(error => expect(error.message).toEqual('Cannot provide EventBus transport layer if it is not registered'), fail),
    );
  });

  test('returns error if EventBus is not evaluated in the context', () => {
    pipe(
      createContext(),
      register(bindTo(EventBusToken)(eventBus({ listener: messagingListener() }))),
      provideTransportLayer(Transport.LOCAL),
      E.fold(error => expect(error.message).toEqual('Cannot provide non-evaluated EventBus transport layer'), fail),
    );
  });

  test('returns error if unsupported transport layer type is requested', () => {
    pipe(
      createContext(),
      provideTransportLayer(Transport.MQTT),
      E.fold( error => expect(error.message).toEqual(`Unsupported transport type: "${Transport.MQTT}"`), fail),
    );
  });
});
