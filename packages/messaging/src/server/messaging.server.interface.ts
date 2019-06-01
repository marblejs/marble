import { BoundDependency } from '@marblejs/core';
import { messagingListener } from '../listener/messaging.listener';
import { NatsStrategy } from '../transport/strategies/nats.strategy.interface';
import { TcpStrategy } from '../transport/strategies/tcp.strategy.interface';
import { AmqpStrategy } from '../transport/strategies/amqp.strategy.interface';

type ConfigurationBase =  {
  messagingListener: ReturnType<typeof messagingListener>;
  dependencies?: BoundDependency<any>[];
}

export type CreateMicroserviceConfig =
  | AmqpStrategy & ConfigurationBase
  | NatsStrategy & ConfigurationBase
  | TcpStrategy & ConfigurationBase
  ;
