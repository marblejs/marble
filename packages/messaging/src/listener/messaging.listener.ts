import { reader, ContextReader } from '@marblejs/core';
import { map } from 'rxjs/operators';
import { Transport, TransportMessageTransformer } from '../transport/transport.interface';
import { provideTransportServer } from '../transport/transport.provider';
import { jsonTransformer } from '../transport/transport.transformer';

export interface MessagingListenerConfig {
  effects?: any[]; // @TODO
  middlewares?: any[]; // @TODO
  transport?: Transport;
  messageTransformer?: TransportMessageTransformer<any>;
  options?: any; // @TODO
}

export const messagingListener = (config: MessagingListenerConfig = {}) => {
  const {
    effects = [],
    middlewares = [],
    transport = Transport.TCP,
    messageTransformer = jsonTransformer,
    options = {},
  } = config;

  const transportServer = provideTransportServer(transport, options);

  return (): ContextReader => reader.map(() => {
    // @TODO
    transportServer.then(server => {
      server.connect().then(con => {
        con.handleMessage().pipe(
          map(messageTransformer.decode),
        ).subscribe(console.log);

        const encodedMessage = messageTransformer.encode({ type: 'TEST', payload: 'test_message' });
        con.sendMessage(encodedMessage);
      });
    });
  });
};
