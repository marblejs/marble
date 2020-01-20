import { Observable } from 'rxjs';
import { Event } from '@marblejs/core';
import { RedisStrategy } from './strategies/redis.strategy.interface';
import { AmqpStrategy } from './strategies/amqp.strategy.interface';
import { TcpStrategy } from './strategies/tcp.strategy.interface';
import { LocalStrategy } from './strategies/local.strategy.interface';

export const DEFAULT_TIMEOUT = 120 * 1000;

export enum Transport {
  TCP,
  NATS,
  AMQP,
  REDIS,
  MQTT,
  GRPC,
  LOCAL,
}

export type TransportStrategy =
  | AmqpStrategy
  | RedisStrategy
  | TcpStrategy
  | LocalStrategy
  ;

export interface TransportLayer {
  connect: (opts?: { isConsumer: boolean }) => Promise<TransportLayerConnection>;
  type: Transport;
  config: TransportLayerConfig;
}

export interface TransportLayerConfig {
  host: string;
  channel: string;
  timeout: number;
}

export interface TransportLayerConnection {
  sendMessage: (channel: string, message: TransportMessage<Buffer>) => Promise<TransportMessage<Buffer>>;
  emitMessage: (channel: string, message: TransportMessage<Buffer>) => Promise<boolean>;
  ackMessage: (message: TransportMessage | undefined) => void;
  nackMessage: (message: TransportMessage | undefined, resend?: boolean) => void;
  close: () => Promise<any>;
  getChannel(): string;
  message$: Observable<TransportMessage<Buffer>>;
  status$: Observable<string>;
  error$: Observable<Error>;
  close$: Observable<any>;
}

export interface TransportMessageTransformer<T> {
  decode: (incomingEvent: Buffer) => T;
  encode: (outgoingEvent: T) => Buffer;
}

export interface TransportMessage<T = Event> {
  data: T;
  raw?: any;
  replyTo?: string;
  correlationId?: string;
}
