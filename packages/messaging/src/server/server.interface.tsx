import { Observable } from 'rxjs';

export enum Transport {
  TCP,
  NATS,
  RABBITMQ,
  REDIS,
  MQTT,
  GRPC,
}

export interface TransportServer {
  listen: () => any;
  close: () => any;
  sendMessage: <T>(msg: T, channel: any) => Observable<any>;
  handleMessage: <T>(msg: T) => Observable<any>;
}
