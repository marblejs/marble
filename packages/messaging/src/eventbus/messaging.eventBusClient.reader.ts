import { pipe } from 'fp-ts/lib/pipeable';
import * as R from 'fp-ts/lib/Reader';
import { Context, createContextToken } from '@marblejs/core';
import { Transport } from '../transport/transport.interface';
import { MessagingClient } from '../client/messaging.client.interface';
import { messagingClient } from '../client/messaging.client';

export const EventBusClientToken = createContextToken<MessagingClient>('EventBusClient');

export const eventBusClient = pipe(
  R.ask<Context>(),
  R.map(messagingClient({
    transport: Transport.LOCAL,
    options: {},
  })),
);
