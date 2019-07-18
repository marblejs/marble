import { BoundDependency } from '@marblejs/core';
import { NatsStrategy } from '../transport/strategies/nats.strategy.interface';
import { TcpStrategy } from '../transport/strategies/tcp.strategy.interface';
import { AmqpStrategy } from '../transport/strategies/amqp.strategy.interface';
import { messagingListener } from './messaging.server.listener';
import { MsgServerEffect } from '../effects/messaging.effects.interface';

type ConfigurationBase =  {
  messagingListener: ReturnType<typeof messagingListener>;
  dependencies?: BoundDependency<any>[];
  event$?: MsgServerEffect;
}

export type CreateMicroserviceConfig =
  | AmqpStrategy & ConfigurationBase
  | NatsStrategy & ConfigurationBase
  | TcpStrategy & ConfigurationBase
  ;
