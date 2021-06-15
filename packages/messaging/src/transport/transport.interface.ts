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

export interface TransportLayer<T extends Transport = Transport> {
  connect: (opts?: { isConsumer: boolean }) => Promise<TransportLayerConnection<T>>;
  type: T;
  config: TransportLayerConfig;
}

export interface TransportLayerConfig {
  host: string;
  channel: string;
  timeout: number;
}

export interface TransportLayerConnection<T extends Transport = Transport> {
  sendMessage: (channel: string, message: TransportMessage<Buffer>) => Promise<TransportMessage<Buffer>>;
  emitMessage: (channel: string, message: TransportMessage<Buffer>) => Promise<boolean>;
  ackMessage: (message: TransportMessage | undefined) => void;
  nackMessage: (message: TransportMessage | undefined, resend?: boolean) => void;
  close: () => Promise<any>;
  getChannel(): string;
  type: T;
  config: { timeout: number, channel: string; raw: any; };
  message$: Observable<TransportMessage<Buffer>>;
  status$: Observable<string>;
  error$: Observable<Error>;
  close$: Observable<any>;
}

export interface TransportMessageTransformer {
  decode: <T extends Event = Event>(incomingEvent: Buffer) => T;
  encode: (outgoingEvent: Event) => Buffer;
}

export interface TransportMessage<T = Event> {
  data: T;
  raw?: any;
  replyTo?: string;
  correlationId?: string;
}

export const isTransportLayerConnection = <T extends Transport>(data: any): data is TransportLayerConnection<T> => {
  const conn = data as Partial<TransportLayerConnection>;
  return Boolean(conn.status$ && conn.emitMessage && conn.sendMessage);
}
