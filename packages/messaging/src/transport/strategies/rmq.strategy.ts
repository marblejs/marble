import { EMPTY, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Channel, Connection, ConsumeMessage } from 'amqplib';
import { TransportServer } from '../transport.interface';

interface RmqStrategyOptions {
  host: string;
  queue: string;
  queueOptions?: any;
  socketOptions?: any;
  prefetchCount?: number;
  isGlobalPrefetchCount?: boolean;
}

export const createRmqStrategy = async (options: RmqStrategyOptions): Promise<TransportServer> => {
  const amqplib = await import('amqplib');
  const message$ = new Subject<ConsumeMessage>();

  const sendMessage = (channelInstance: Channel) => (message: Buffer) => {
    channelInstance.sendToQueue(options.queue, message);
    return EMPTY;
  };

  const handleMessage = (channelInstance: Channel) => () => {
    channelInstance.consume(
      options.queue,
      message => message && message$.next(message),
      { noAck: true },
    );

    return message$.pipe(map(message => message.content));
  };

  const close = (connection: Connection) => () => {
    return connection.close() as any as Promise<void>;
  };

  const connect = async () => {
    const connection = await amqplib.connect(options.host);
    const channel = await connection.createChannel();
    channel.assertQueue(options.queue, options.queueOptions);

    return {
      sendMessage: sendMessage(channel),
      handleMessage: handleMessage(channel),
      close: close(connection),
    };
  };

  return { connect };
};
