import { Observable } from 'rxjs';
import { NatsStrategy } from '../transport/strategies/nats.strategy.interface';
import { TcpStrategy } from '../transport/strategies/tcp.strategy.interface';
import { AmqpStrategy } from '../transport/strategies/amqp.strategy.interface';
import { TransportMessageTransformer } from '../transport/transport.interface';

export interface MessagingClient {
  emit: <T>(data: T) => Observable<any>;
  send: <T, U>(data: T) => Observable<U>;
  publish: <T>(data: T) => Observable<any>;
  close: () => Observable<any>;
}

type ConfigurationBase =  {
  msgTransformer?: TransportMessageTransformer<any>;
}

export type MessagingClientConfig =
  | AmqpStrategy & ConfigurationBase
  | NatsStrategy & ConfigurationBase
  | TcpStrategy & ConfigurationBase
  ;
