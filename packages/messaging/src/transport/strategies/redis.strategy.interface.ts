import { Transport } from '../transport.interface';

export interface RedisStrategy {
  transport: Transport.REDIS;
  options: RedisStrategyOptions;
}

export interface RedisStrategyOptions {
  host: string;
  channel: string;
  port?: number;
  password?: string;
}


export enum RedisConnectionStatus {
  READY = 'READY',
  CONNECT = 'CONNECT',
  RECONNECTING = 'RECONNECTING',
  END = 'END',
}
