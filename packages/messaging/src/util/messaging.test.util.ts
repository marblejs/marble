import * as uuid from 'uuid/v4';
import { createMicroservice } from '../server/messaging.server';
import { TransportMessage, Transport } from '../transport/transport.interface';
import { MsgEffect, MsgErrorEffect } from '../effects/messaging.effects.interface';
import { messagingListener } from '../server/messaging.server.listener';
import { provideTransportLayer } from '../transport/transport.provider';

export const runServer = (transport: any, options: any) => (effect$?: MsgEffect, error$?: MsgErrorEffect) =>
  createMicroservice({
    options,
    transport,
    messagingListener: messagingListener(effect$ ? { effects: [effect$], error$ } : undefined),
  })();

export const runClient = (transport: Transport, transportOptions: any) =>
  provideTransportLayer(transport, transportOptions).connect({ isConsumer: false });

export const createMessage = (data: any): TransportMessage<Buffer> => ({
  data: Buffer.from(JSON.stringify(data)),
  correlationId: uuid(),
});

export const wait = (seconds = 1) =>
  new Promise(res => {
    setTimeout(() => res(), seconds * 1000);
  });

