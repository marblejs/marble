import { Transport } from '../transport.interface';

export interface RedisStrategy {
  transport: Transport.REDIS;
  options: RedisStrategyOptions;
}

export interface RedisStrategyOptions {
  // @TODO
}
