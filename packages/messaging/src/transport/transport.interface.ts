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
  sendMessage: (channel: string, message: TransportMessage<Buffer>, opts?: TransportLayerSendOpts) => Observable<any>;
  consumeMessage: () => Promise<any>;
  consumeResponse: () => Promise<any>;
  close: () => Promise<any>;
  error$: Observable<Error>;
  message$: Observable<TransportMessage<Buffer>>;
  response$: Observable<TransportMessage<Buffer>>;
}

export interface TransportLayerSendOpts {
  type?: 'publish' | 'send' | 'emit';
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
