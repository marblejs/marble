import { Options } from 'amqplib';
import { Transport } from '../transport.interface';

export interface AmqpStrategy {
  transport: Transport.AMQP;
  options: AmqpStrategyOptions;
}

export interface AmqpStrategyOptions {
  host: string;
  queue: string;
  queueOptions?: Options.AssertQueue;
  socketOptions?: any;
  prefetchCount?: number;
  isGlobalPrefetchCount?: boolean;
}
