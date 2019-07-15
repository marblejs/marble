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
  connect: () => Promise<TransportLayerConnection>;
}

export interface TransportLayerConnection {
  sendMessage: (channel: string, message: TransportMessage<Buffer>) => Promise<any>;
  emitMessage: (channel: string, message: TransportMessage<Buffer>) => Promise<any>;
  consumeMessage: () => Observable<TransportMessage<Buffer>>;
  ack: (msg: TransportMessage<any>) => void;
  close: () => Promise<any>;
  getChannel(): string;
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
