import { ServerConfig, ServerIO } from '@marblejs/core';
import { MsgServerEffect } from '../effects/messaging.effects.interface';
import { TransportStrategy, TransportLayerConnection } from '../transport/transport.interface';
import { messagingListener } from './messaging.server.listener';

type MessagingListenerFn = ReturnType<typeof messagingListener>;
type ConfigurationBase = ServerConfig<MsgServerEffect, MessagingListenerFn>;

export type CreateMicroserviceConfig =
  & TransportStrategy
  & ConfigurationBase
  ;

export type Microservice = ServerIO<TransportLayerConnection>;
