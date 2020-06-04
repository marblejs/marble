import { v4 as uuid } from 'uuid';
import { bindTo, createContext, Event, register, LoggerToken, mockLogger } from '@marblejs/core';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { pipe } from 'fp-ts/lib/pipeable';
import { flow } from 'fp-ts/lib/function';
import { merge } from 'rxjs';
import { tap, catchError, take, toArray, filter, ignoreElements, map } from 'rxjs/operators';
import { createMicroservice } from '../server/messaging.server';
import { TransportMessage, Transport } from '../transport/transport.interface';
import { MsgOutputEffect, MsgErrorEffect } from '../effects/messaging.effects.interface';
import { messagingListener, MessagingListenerConfig } from '../server/messaging.server.listener';
import { eventBus, eventBusClient } from '../eventbus/messaging.eventBus.reader';
import { messagingClient } from '../client/messaging.client';
import { AmqpStrategyOptions } from '../transport/strategies/amqp.strategy.interface';
import { RedisStrategyOptions } from '../transport/strategies/redis.strategy.interface';

// event bus
export const runEventBus = (config: MessagingListenerConfig) =>
  pipe(
    createTestContext(),
    eventBus({ listener: messagingListener(config) }),
  );

export const runEventBusClient = () =>
  pipe(
    createTestContext(),
    eventBusClient,
  );

// microservice
export const createTestMicroservice = (transport: any, options: any) => async (config: MessagingListenerConfig = {}) => {
  const listener = messagingListener(config);
  return (await createMicroservice({ options, transport, listener }))();
};

export const createTestClient = (transport: any, options: any) =>
  pipe(
    createTestContext(),
    messagingClient({ transport, options: { ...options, expectAck: false } }),
  );

export const createAmqpClient = (options: AmqpStrategyOptions) =>
  createTestClient(Transport.AMQP, options);

export const createAmqpMicroservice = (options: AmqpStrategyOptions) =>
  createTestMicroservice(Transport.AMQP, options);

export const createRedisClient = (options: RedisStrategyOptions) =>
  createTestClient(Transport.REDIS, options);

export const createRedisMicroservice = (options: RedisStrategyOptions) =>
  createTestMicroservice(Transport.REDIS, options);

export const createAmqpOptions = (config: Partial<AmqpStrategyOptions> = {}): AmqpStrategyOptions => ({
  host: 'amqp://localhost:5672',
  queue: config.queue ?? createUuid(),
  expectAck: config.expectAck ?? false,
  queueOptions: { durable: false, autoDelete: true },
  timeout: 500,
});

export const createRedisOptions = (config: Partial<RedisStrategyOptions> = {}): RedisStrategyOptions => ({
  host: 'redis://127.0.0.1:6379',
  channel: config.channel ?? createUuid(),
  timeout: 500,
});

// other
export const createMessage = (data: any, correlationId?: string): TransportMessage<Buffer> => ({
  data: Buffer.from(JSON.stringify(data)),
  correlationId: correlationId ?? uuid(),
});

export const createTestContext = () => {
  const boundLogger = bindTo(LoggerToken)(mockLogger);
  return flow(register(boundLogger))(createContext());
};

export const assertOutputEvent = (...outEvent: Event[]) => (done: jest.DoneCallback): MsgOutputEffect => event$ => {
  const isAssertionEvent = (event: Event) =>
    outEvent.map(e => e.type).includes(event.type);

  return merge(
    event$.pipe(
      filter(isAssertionEvent),
      take(outEvent.length),
      toArray(),
      tap(events => events.forEach((event, i) => expect(event).toEqual(expect.objectContaining(outEvent[i])))),
      tap(teardown(done)),
      catchError(fail),
      ignoreElements(),
    ),
    event$,
  );
}

export const assertError = (error: any) => (done: jest.DoneCallback): MsgErrorEffect => error$ =>
  error$.pipe(
    map(error => ({ type: 'UNHANDLED_ERROR', error: { name: error.name, message: error.message }})),
    tap(event => expect(event.error).toEqual(error)),
    tap(teardown(done)),
    catchError(fail),
  );

export const teardown = (done: jest.DoneCallback) => () =>
  setTimeout(done, 1000);
