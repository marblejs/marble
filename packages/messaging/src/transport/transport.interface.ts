import { Observable } from 'rxjs';

export enum Transport {
  TCP,
  NATS,
  RMQ,
  REDIS,
  MQTT,
  GRPC,
}

export interface TransportServer {
  connect: () => Promise<TransportServerConnection>;
}

export interface TransportServerConnection {
  sendMessage: (msg: Buffer) => Observable<any>;
  handleMessage: () => Observable<any>;
  close: () => Promise<any>;
}

export interface TransportMessageTransformer<T> {
  decode: (incomingEvent: Buffer) => T;
  encode: (outgoingEvent: T) => Buffer;
}
