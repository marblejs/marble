import { Subject, fromEvent, of } from 'rxjs';
import { map, share, filter } from 'rxjs/operators';
import { Channel, Connection, ConsumeMessage } from 'amqplib';
import { TransportLayer, TransportLayerSendOpts, TransportMessage } from '../transport.interface';
import { AmqpStrategyOptions } from './amqp.strategy.interface';

export const createAmqpStrategy = async (options: AmqpStrategyOptions): Promise<TransportLayer> => {
  const msgSubject$ = new Subject<ConsumeMessage>();
  const resSubject$ = new Subject<ConsumeMessage>();
  const responseQueue = options.queue + '__response';

  const message$ = msgSubject$.asObservable().pipe(
    share(),
    map(message => ({
      data: message.content,
      replyTo: message.properties.replyTo,
      correlationId: message.properties.correlationId,
      raw: message,
    } as TransportMessage<Buffer>))
  );

  const response$ = resSubject$.asObservable().pipe(
    share(),
    map(message => ({
      data: message.content,
      replyTo: message.properties.replyTo,
      correlationId: message.properties.correlationId,
      raw: message,
    } as TransportMessage<Buffer>))
  );

  const consumeMessage = (channelInstance: Channel) => () => Promise.resolve(
    channelInstance.consume(
      options.queue,
      msg => msg && msgSubject$.next(msg),
      { noAck: true },
    ),
  );

  const consumeResponse = (channelInstance: Channel) => () => Promise.resolve(
    channelInstance.consume(
      responseQueue,
      res => res && resSubject$.next(res),
      { noAck: true },
    ),
  );

  const sendMessage = (channelInstance: Channel) => (
    queue: string,
    msg: TransportMessage<Buffer>,
    opts: TransportLayerSendOpts = {},
  ) => {
    const { correlationId, replyTo } = msg;

    switch (opts.type) {
      case 'publish':
        channelInstance.assertExchange(queue, 'fanout', { durable: false });
        return of(channelInstance.publish(queue, '', msg.data));
      case 'send':
        channelInstance.prefetch(1);
        channelInstance.sendToQueue(queue, msg.data, { correlationId, replyTo: responseQueue });
        return response$.pipe(filter(m => m.correlationId === correlationId));
      default:
        return of(channelInstance.sendToQueue(queue, msg.data, { replyTo, correlationId }));
    }
  };

  const close = (connection: Connection) => (channelInstance: Channel) => () =>
    Promise.resolve(channelInstance.close().then(() => connection.close()))

  const error$ = (connection: Connection) =>
    fromEvent<Error>(connection, 'error');

  const connect = async () => {
    const amqplib = await import('amqplib');
    const connection = await amqplib.connect(options.host);
    const channel = await connection.createChannel();

    await channel.assertQueue(options.queue, options.queueOptions);
    await channel.assertQueue(responseQueue);

    return {
      channel: options.queue,
      sendMessage: sendMessage(channel),
      consumeMessage: consumeMessage(channel),
      consumeResponse: consumeResponse(channel),
      close: close(connection)(channel),
      error$: error$(connection),
      response$,
      message$,
    };
  };

  return { connect };
};
