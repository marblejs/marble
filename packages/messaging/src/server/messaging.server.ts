import { createContext, registerAll, bindTo } from '@marblejs/core';
import { CreateMicroserviceConfig } from './messaging.server.interface';
import { provideTransportLayer } from '../transport/transport.provider';
import { TransportLayerToken } from './messaging.server.tokens';

export const createMicroservice = (config: CreateMicroserviceConfig) => {
  const {
    options,
    transport,
    dependencies = [],
    messagingListener,
  } = config;

  const transportLayer = provideTransportLayer(transport, options);
  const boundTransportLayer = bindTo(TransportLayerToken)(() => transportLayer);
  const context = registerAll([ boundTransportLayer, ...dependencies ])(createContext());
  const listenerWithContext = messagingListener.run(context);

  return {
    run: listenerWithContext.listen,
  }
};
