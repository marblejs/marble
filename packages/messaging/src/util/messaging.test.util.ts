import * as uuid from 'uuid/v4';
import { createContext, register, bindTo, LoggerToken, mockLogger } from '@marblejs/core';
import { flow } from 'fp-ts/lib/function';
import { createMicroservice } from '../server/messaging.server';
import { TransportMessage, Transport } from '../transport/transport.interface';
import { MsgEffect, MsgOutputEffect, MsgErrorEffect } from '../effects/messaging.effects.interface';
import { messagingListener } from '../server/messaging.server.listener';
import { provideTransportLayer } from '../transport/transport.provider';
import { eventBus, eventBusClient } from '../eventbus/messaging.eventBus.reader';

// event bus
export const runEventBus =
  async (effect$?: MsgEffect, output$?: MsgOutputEffect, error$?: MsgErrorEffect) => {
    const context = createTestContext();
    const listener = messagingListener({ effects: effect$ ? [effect$] : [], output$, error$ });
    return eventBus({ listener })(context);
  };

export const runEventBusClient = () => eventBusClient(createTestContext());

// microservice
export const runMicroservice = (transport: any, options: any) =>
  async (effect$?: MsgEffect, output$?: MsgOutputEffect, error$?: MsgErrorEffect) => {
    const listener = messagingListener({ effects: effect$ ? [effect$] : [], output$, error$ });
    return (await createMicroservice({ options, transport, listener }))();
  };

export const runMicroserviceClient = (transport: Transport, transportOptions: any) =>
  provideTransportLayer(transport, transportOptions).connect({ isConsumer: false });

// other
export const createMessage = (data: any): TransportMessage<Buffer> => ({
  data: Buffer.from(JSON.stringify(data)),
  correlationId: uuid(),
});

export const createTestContext = () => {
  const boundLogger = bindTo(LoggerToken)(mockLogger);
  return flow(register(boundLogger))(createContext());
};
