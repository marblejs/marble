import { Transport, TransportLayer } from './transport.interface';
import { createAmqpStrategy } from './strategies/amqp.strategy';

// @TODO
import { createTcpStrategy } from './strategies/tcp.strategy';
import { createNatsStrategy } from './strategies/nats.strategy';

export const provideTransportLayer = (transport: Transport, transportOptions: any): TransportLayer => {
  switch (transport) {
    case Transport.AMQP:
      return createAmqpStrategy(transportOptions);
    default:
      // @TODO
      return createAmqpStrategy(transportOptions);
  }
};
