import { BoundDependency } from '@marblejs/core';
import { MsgServerEffect } from '../effects/messaging.effects.interface';
import { TransportStrategy, TransportLayerConnection } from '../transport/transport.interface';
import { messagingListener } from './messaging.server.listener';

type ConfigurationBase =  {
  messagingListener: ReturnType<typeof messagingListener>;
  dependencies?: BoundDependency<any>[];
  event$?: MsgServerEffect;
}

export type CreateMicroserviceConfig =
  & TransportStrategy
  & ConfigurationBase
  ;

export interface Microservice {
  (): Promise<TransportLayerConnection>;
}
