import { Transport, TransportLayer } from './transport.interface';
import { createAmqpStrategy } from './strategies/amqp.strategy';
import { createRedisStrategy } from './strategies/redis.strategy';

export const provideTransportLayer = (transport: Transport, transportOptions: any): TransportLayer => {
  switch (transport) {
    case Transport.AMQP:
      return createAmqpStrategy(transportOptions);
    case Transport.REDIS:
      return createRedisStrategy(transportOptions);
    default:
      throw new Error(`Unsupported transport type: ${transport}`);
  }
};
