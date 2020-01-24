import { pipe } from 'fp-ts/lib/pipeable';
import { flow } from 'fp-ts/lib/function';
import { deleteAt } from 'fp-ts/lib/Map';
import * as R from 'fp-ts/lib/Reader';
import { Context, resolve, bindTo, register, setoidContextToken, createContextToken } from '@marblejs/core';
import { TransportLayerToken } from '../server/messaging.server.tokens';
import { Transport, TransportLayerConnection } from '../transport/transport.interface';
import { provideTransportLayer } from '../transport/transport.provider';
import { messagingListener } from '../server/messaging.server.listener';
import { MessagingClient } from '../client/messaging.client.interface';
import { messagingClient } from '../client/messaging.client';

interface EventBusConfig {
  listener: ReturnType<typeof messagingListener>;
}

export const EventBusToken = createContextToken<TransportLayerConnection>('EventBusToken');
export const EventBusClientToken = createContextToken<MessagingClient>('EventBusClientToken');

export const eventBus = (config: EventBusConfig) => pipe(
  R.ask<Context>(),
  R.map(async rootContext => {
    const { listener } = config;
    const ctx = deleteAt(setoidContextToken)(EventBusToken)(rootContext);
    const transportLayer = provideTransportLayer(Transport.LOCAL);
    const transportLayerConnection = await transportLayer.connect();
    const boundTransportLayer = bindTo(TransportLayerToken)(() => transportLayer);
    const context = await flow(register(boundTransportLayer), resolve)(ctx);

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
