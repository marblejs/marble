import { pipe } from 'fp-ts/lib/pipeable';
import * as R from 'fp-ts/lib/Reader';
import { Context, bindTo, createContextToken, contextFactory, bindEagerlyTo, DerivedContextToken, logContext, LoggerTag } from '@marblejs/core';
import { TransportLayerToken } from '../server/messaging.server.tokens';
import { Transport, TransportLayerConnection } from '../transport/transport.interface';
import { provideTransportLayer } from '../transport/transport.provider';
import { messagingListener } from '../server/messaging.server.listener';
import { MessagingClient } from '../client/messaging.client.interface';
import { messagingClient } from '../client/messaging.client';
import { EventTimerStoreToken, EventTimerStore } from '../eventStore/eventTimerStore';

export interface EventBusConfig {
  listener: ReturnType<typeof messagingListener>;
}

export const EventBusToken = createContextToken<TransportLayerConnection>('EventBusToken');
export const EventBusClientToken = createContextToken<MessagingClient>('EventBusClientToken');

export const eventBus = (config: EventBusConfig) => pipe(
  R.ask<Context>(),
  R.map(async derivedContext => {
    const { listener } = config;
    const transportLayer = provideTransportLayer(Transport.LOCAL);
    const transportLayerConnection = await transportLayer.connect();

    const context = await contextFactory(
      bindEagerlyTo(DerivedContextToken)(() => derivedContext),
      bindTo(TransportLayerToken)(() => transportLayer),
      bindTo(EventTimerStoreToken)(EventTimerStore),
    );

    logContext(LoggerTag.EVENT_BUS)(context);

    listener(context)(transportLayerConnection);

    return transportLayerConnection;
  }),
);

export const eventBusClient = pipe(
  R.ask<Context>(),
  R.map(messagingClient({
    transport: Transport.LOCAL,
    options: {},
  })),
);
