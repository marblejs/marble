import { Transport } from '../transport.interface';

export interface LocalStrategy {
  transport: Transport.LOCAL;
  options: LocalStrategyOptions;
}

export interface LocalStrategyOptions {
  timeout?: number;
}
