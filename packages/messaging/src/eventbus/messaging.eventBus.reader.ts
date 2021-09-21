import * as R from 'fp-ts/lib/Reader';
import * as M from 'fp-ts/lib/Map';
import * as O from 'fp-ts/lib/Option';
import { pipe, constant } from 'fp-ts/lib/function';
import { Context, bindTo, contextFactory, bindEagerlyTo, DerivedContextToken, logContext, LoggerTag, ordContextToken, createContextToken } from '@marblejs/core';
import { TransportLayerToken } from '../server/messaging.server.tokens';
import { Transport, TransportLayerConnection } from '../transport/transport.interface';
import { messagingListener } from '../server/messaging.server.listener';
import { EventTimerStoreToken, EventTimerStore } from '../eventStore/eventTimerStore';
import { createLocalStrategy } from '../transport/strategies/local.strategy';
import { MessagingClient } from '../client/messaging.client';
import { EventBusClientToken } from './messaging.eventBusClient.reader';

export interface EventBusConfig {
  listener: ReturnType<typeof messagingListener>;
  timeout?: number;
}

export interface EventBus extends TransportLayerConnection<Transport.LOCAL> {
  context: Context;
}

export const EventBusToken = createContextToken<EventBus>('EventBus');

/**
 * `EventBus` has to be registered eagerly before `EventBusClient` reader
 *
 * @param config `EventBusConfig`
 * @returns asynchronous reader of `EventBus`
 * @since v3.0
 */
export const EventBus = (config: EventBusConfig) =>
  pipe(
    R.ask<Context>(),
    R.map<Context, Promise<EventBus>>(async derivedContext => {
      const { listener } = config;
      const transportLayer = createLocalStrategy(config);
      const transportLayerConnection = await transportLayer.connect();

      const setEventBusClientInDerivedContext = (derivedContext: Context): Context =>
        pipe(
          M.lookup(ordContextToken)(EventBusClientToken)(derivedContext),
          O.fold(constant(derivedContext), () => derivedContext.set(EventBusClientToken, internalMessagingClient)),
        );

      const internalMessagingClient = await pipe(
        await contextFactory(bindEagerlyTo(EventBusToken)(() => transportLayerConnection)),
        MessagingClient({ transport: Transport.LOCAL, options: {} }),
      );

      const context = await pipe(
        setEventBusClientInDerivedContext(derivedContext),
        derivedContext => contextFactory(
          bindEagerlyTo(DerivedContextToken)(() => derivedContext),
          bindEagerlyTo(EventBusClientToken)(() => internalMessagingClient),
          bindTo(TransportLayerToken)(() => transportLayer),
          bindTo(EventTimerStoreToken)(EventTimerStore),
        ),
      );

      logContext(LoggerTag.EVENT_BUS)(context);

      listener(context)(transportLayerConnection);

      const eventBus = transportLayerConnection as EventBus;

      eventBus.context = context;

      return eventBus;
    }),
  );

/**
 * An alias for `EventBus`
 *
 * @deprecated since version `v4.0`. Use `EventBusClient` instead.
 * Will be removed in version `v5.0`
 */
 export const eventBus = EventBus;
