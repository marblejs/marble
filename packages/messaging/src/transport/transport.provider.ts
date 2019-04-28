import { Transport, TransportServer } from './transport.interface';
import { createRmqStrategy } from './strategies/rmq.strategy';

// @TODO
import { createTcpStrategy } from './strategies/tcp.strategy';
import { createNatsStrategy } from './strategies/nats.strategy';

export const provideTransportServer = (transport: Transport, transportOptions: any): Promise<TransportServer> => {
  switch (transport) {
    case Transport.RMQ:
      return createRmqStrategy(transportOptions);
    default:
      // @TODO
      return createRmqStrategy(transportOptions);
  }
};
