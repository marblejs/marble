import { Subject, fromEvent, of } from 'rxjs';
import { map, share, filter } from 'rxjs/operators';
import { Channel, Connection, ConsumeMessage } from 'amqplib';
import { TransportLayer, TransportLayerSendOpts, TransportMessage } from '../transport.interface';
import { AmqpStrategyOptions } from './amqp.strategy.interface';

export const createAmqpStrategy = async (options: AmqpStrategyOptions): Promise<TransportLayer> => {
  const msgSubject$ = new Subject<ConsumeMessage>();
  const resSubject$ = new Subject<ConsumeMessage>();

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

  const consumeMessage = (channelInstance: Channel) => async () =>
    channelInstance.consume(
      options.queue,
      msg => msg && msgSubject$.next(msg),
    );

  const consumeResponse = (channelInstance: Channel) => (responseQueue: string) => async () =>
    channelInstance.consume(
      responseQueue,
      res => res && resSubject$.next(res),
      { noAck: true },
    );

  const sendMessage = (channelInstance: Channel) => (responseQueue: string) => (
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
        channelInstance.sendToQueue(queue, msg.data, { correlationId, replyTo: responseQueue });
        return response$.pipe(filter(m => m.correlationId === correlationId));
      default:
        return of(channelInstance.sendToQueue(queue, msg.data, { replyTo, correlationId }));
    }
  };

  const ack = (channelInstance: Channel) => (msg: any) =>
    channelInstance.ack(msg);

  const close = (connection: Connection) => (channelInstance: Channel) => async () => {
    await channelInstance.close();
    await connection.close();
  }

  const close$ = (connection: Connection) =>
    fromEvent<Error>(connection, 'close');

  const error$ = (connection: Connection) =>
    fromEvent<Error>(connection, 'error');

  const connect = async () => {
    const amqplib = await import('amqplib');
    const connection = await amqplib.connect(options.host);
    const channel = await connection.createChannel();

    await channel.prefetch(1);
    await channel.assertQueue(options.queue, options.queueOptions);
    const responseQueue = await channel.assertQueue('', { exclusive: true });

    return {
      channel: options.queue,
      ack: ack(channel),
      sendMessage: sendMessage(channel)(responseQueue.queue),
      consumeMessage: consumeMessage(channel),
      consumeResponse: consumeResponse(channel)(responseQueue.queue),
      close: close(connection)(channel),
      error$: error$(connection),
      close$: close$(connection),
      response$,
      message$,
    };
  };

  return { connect };
};
