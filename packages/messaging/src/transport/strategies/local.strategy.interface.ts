import { Transport } from '../transport.interface';

export const EVENT_BUS_CHANNEL = 'event_bus';

export interface LocalStrategy {
  transport: Transport.LOCAL;
  options: LocalStrategyOptions;
}

export interface LocalStrategyOptions {
  timeout?: number;
}
