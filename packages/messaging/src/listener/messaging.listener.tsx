import { reader, ContextReader } from '@marblejs/core';
import { Transport } from '../server/server.interface';

export interface MessagingListenerConfig {
  effects?: any[];
  middlewares?: any[];
  transport?: Transport;
}

export const messagingListener = (config: MessagingListenerConfig = {}) => {
  const { effects = [], middlewares = [], transport = Transport.TCP } = config;

  return (): ContextReader => reader.map(ask => {
    return {}; // @TODO
  });
};
