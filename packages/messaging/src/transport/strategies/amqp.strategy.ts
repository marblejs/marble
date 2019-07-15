import { Subject, fromEvent, from } from 'rxjs';
import { map, filter, take, mergeMap, mapTo } from 'rxjs/operators';
import { Channel, Connection, ConsumeMessage } from 'amqplib';
import { TransportLayer, TransportMessage, TransportLayerConnection } from '../transport.interface';
import { AmqpStrategyOptions } from './amqp.strategy.interface';

class AmqpStrategyConnection implements TransportLayerConnection {
  constructor(
    private connection: Connection,
    private channel: Channel,
    private options: AmqpStrategyOptions,
  ) {}

  get close$() {
    return fromEvent(this.connection, 'close');
  }

  get error$() {
    return fromEvent<Error>(this.connection, 'error');
  }

  consumeMessage = () => {
    const msgSubject$ = new Subject<ConsumeMessage>();

    this.channel.consume(
      this.options.queue,
      msg => msg && msgSubject$.next(msg),
    );

    return msgSubject$.asObservable().pipe(
      map(message => ({
        data: message.content,
        replyTo: message.properties.replyTo,
        correlationId: message.properties.correlationId,
        raw: message,
      } as TransportMessage<Buffer>))
    );
  }

  sendMessage = async (queue: string, msg: TransportMessage<Buffer>) => {
    const { correlationId, data } = msg;
    const resSubject$ = new Subject<ConsumeMessage>();
    const replyQueue = await this.channel.assertQueue('', { exclusive: true });

    const consumer = await this.channel.consume(
      replyQueue.queue,
      res => res && resSubject$.next(res),
      { noAck: true },
    );

    this.channel.sendToQueue(queue, data, { correlationId, replyTo: replyQueue.queue });

    return resSubject$.asObservable().pipe(
      filter(raw => raw.properties.correlationId === correlationId),
      take(1),
      mergeMap(raw => from(this.channel.cancel(consumer.consumerTag)).pipe(
        mapTo(({
          data: raw.content,
          replyTo: raw.properties.replyTo,
          correlationId: raw.properties.correlationId,
          raw,
        } as TransportMessage<Buffer>)),
      )),
    ).toPromise();
  };

  emitMessage = async (queue: string, msg: TransportMessage<Buffer>) => {
    const { correlationId, data, replyTo } = msg;
    return Promise.resolve(this.channel.sendToQueue(queue, data, {
      replyTo,
      correlationId,
    }));
  };

  ack = (msg: TransportMessage) => this.channel.ack(msg.raw);

  getChannel = () => this.options.queue;

  close = async () => {
    await this.channel.close();
    await this.connection.close();
  }
}

class AmqpStrategy implements TransportLayer {
  constructor(private options: AmqpStrategyOptions) {}

  async connect() {
    const { host, queue, queueOptions } = this.options;

    const amqplib = await import('amqplib');
    const connection = await amqplib.connect(host);
    const channel = await connection.createChannel();

    await channel.prefetch(1);
    await channel.assertQueue(queue, queueOptions);

    return new AmqpStrategyConnection(
      connection,
      channel,
      this.options,
    );
  }
}

export const createAmqpStrategy = (options: AmqpStrategyOptions): TransportLayer =>
  new AmqpStrategy(options);
