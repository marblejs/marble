import { pipe } from 'fp-ts/lib/pipeable';
import * as R from 'fp-ts/lib/Reader';
import { Context, bindTo, createContextToken, contextFactory, bindEagerlyTo, DerivedContextToken, logContext, LoggerTag } from '@marblejs/core';
import { TransportLayerToken } from '../server/messaging.server.tokens';
import { Transport, TransportLayerConnection } from '../transport/transport.interface';
import { messagingListener } from '../server/messaging.server.listener';
import { EventTimerStoreToken, EventTimerStore } from '../eventStore/eventTimerStore';
import { createLocalStrategy } from '../transport/strategies/local.strategy';

export interface EventBusConfig {
  listener: ReturnType<typeof messagingListener>;
  timeout?: number;
}

export interface EventBus extends TransportLayerConnection<Transport.LOCAL> {
  context: Context;
}

export const EventBusToken = createContextToken<EventBus>('EventBus');

export const eventBus = (config: EventBusConfig) => pipe(
  R.ask<Context>(),
  R.map<Context, Promise<EventBus>>(async derivedContext => {
    const { listener } = config;
    const transportLayer = createLocalStrategy(config);
    const transportLayerConnection = await transportLayer.connect();

    const context = await contextFactory(
      bindEagerlyTo(DerivedContextToken)(() => derivedContext),
      bindTo(TransportLayerToken)(() => transportLayer),
      bindTo(EventTimerStoreToken)(EventTimerStore),
    );

    logContext(LoggerTag.EVENT_BUS)(context);

    listener(context)(transportLayerConnection);

    const eventBus = transportLayerConnection as EventBus;

    eventBus.context = context;

    return eventBus;
  }),
);
