import { pipe } from 'fp-ts/lib/pipeable';
import { deleteAt } from 'fp-ts/lib/Map';
import * as R from 'fp-ts/lib/Reader';
import { Context, bindTo, setoidContextToken, createContextToken, constructContext } from '@marblejs/core';
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
  R.map(async rootContext => {
    const { listener } = config;
    const derivedContext = deleteAt(setoidContextToken)(EventBusToken)(rootContext);
    const transportLayer = provideTransportLayer(Transport.LOCAL);
    const transportLayerConnection = await transportLayer.connect();

    const context = await constructContext(derivedContext)(
      bindTo(TransportLayerToken)(() => transportLayer),
      bindTo(EventTimerStoreToken)(EventTimerStore),
    );

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
