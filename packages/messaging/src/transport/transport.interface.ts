import { Observable } from 'rxjs';
import { Event } from '@marblejs/core';

export enum Transport {
  TCP,
  NATS,
  AMQP,
  REDIS,
  MQTT,
  GRPC,
}

export interface TransportLayer {
  connect: (opts: { isConsumer: boolean }) => Promise<TransportLayerConnection>;
  config: TransportLayerConfig;
}

export interface TransportLayerConfig {
  host: string;
  channel: string;
}

export interface TransportLayerConnection {
  sendMessage: (channel: string, message: TransportMessage<Buffer>) => Promise<TransportMessage<Buffer>>;
  emitMessage: (channel: string, message: TransportMessage<Buffer>) => Promise<any>;
  ackMessage: (message: any | undefined) => void;
  nackMessage: (message: any | undefined, resend?: boolean) => void;
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
