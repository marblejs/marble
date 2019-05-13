import { EMPTY, Subject, from, fromEvent } from 'rxjs';
import { map, share } from 'rxjs/operators';
import { Channel, Connection, ConsumeMessage, Options } from 'amqplib';
import { TransportLayer, TransportMessage } from '../transport.interface';

interface RmqStrategyOptions {
  host: string;
  queue: string;
  queueOptions?: Options.AssertQueue;
  socketOptions?: any;
  prefetchCount?: number;
  isGlobalPrefetchCount?: boolean;
}

export const createAmqpStrategy = async (options: RmqStrategyOptions): Promise<TransportLayer> => {

  const sendMessage = (channelInstance: Channel) => (queue: string, msg: TransportMessage<Buffer>) => {
    const { correlationId, replyTo } = msg;

    channelInstance.sendToQueue(queue, msg.data, { correlationId, replyTo });

    return EMPTY;
  };

  const handleMessage = (channelInstance: Channel) => () => {
    const msg$ = new Subject<ConsumeMessage>();

    channelInstance.consume(
      options.queue,
      msg => msg && msg$.next(msg),
      { noAck: true },
    );

    return msg$.asObservable().pipe(
      share(),
      map(message => ({
        data: message.content,
        replyTo: message.properties.replyTo,
        correlationId: message.properties.correlationId,
        raw: message,
      } as TransportMessage<Buffer>))
    );
  };

  const close = (connection: Connection) => () =>
    from(connection.close());

  const error$ = (connection: Connection) =>
    fromEvent<Error>(connection, 'error');

  const connect = async () => {
    const amqplib = await import('amqplib');
    const connection = await amqplib.connect(options.host);
    const channel = await connection.createChannel();

    channel.assertQueue(options.queue, options.queueOptions);

    return {
      sendMessage: sendMessage(channel),
      handleMessage: handleMessage(channel),
      close: close(connection),
      error$: error$(connection),
    };
  };

  return { connect };
};
