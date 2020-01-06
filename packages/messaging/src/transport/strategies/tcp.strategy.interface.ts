import { Transport } from '../transport.interface';

export interface TcpStrategy {
  transport: Transport.TCP;
  options: TcpStrategyOptions;
}

export interface TcpStrategyOptions {
  // @TODO
}
