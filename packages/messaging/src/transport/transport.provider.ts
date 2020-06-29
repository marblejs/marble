import { Transport } from './transport.interface';
import { createAmqpStrategy } from './strategies/amqp.strategy';
import { createRedisStrategy } from './strategies/redis.strategy';
import { provideLocalStrategy } from './strategies/local.strategy.provider';

export const provideTransportLayer = <T extends Transport>(transport: T, transportOptions: any = {}) => {
  switch (transport) {
    case Transport.AMQP:
      return createAmqpStrategy(transportOptions);
    case Transport.REDIS:
      return createRedisStrategy(transportOptions);
    case Transport.LOCAL:
      return provideLocalStrategy();
    default:
      throw new Error(`Unsupported transport type: ${transport}`);
  }
};
