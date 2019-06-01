import { Transport } from '../transport.interface';

export interface NatsStrategy {
  transport: Transport.NATS;
  options: NatsStrategyOptions;
}

export interface NatsStrategyOptions {
  // @TODO
}
