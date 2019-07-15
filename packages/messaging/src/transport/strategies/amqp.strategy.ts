import { Subject, fromEvent, of } from 'rxjs';
import { map, share, filter } from 'rxjs/operators';
import { Channel, Connection, ConsumeMessage, Replies } from 'amqplib';
import { TransportLayer, TransportLayerSendOpts, TransportMessage, TransportLayerConnection } from '../transport.interface';
import { AmqpStrategyOptions } from './amqp.strategy.interface';

class AmqpStrategyConnection implements TransportLayerConnection {
  private msgSubject$ = new Subject<ConsumeMessage>();
  private resSubject$ = new Subject<ConsumeMessage>();

  constructor(
    private connection: Connection,
    private channel: Channel,
    private responseQueue: Replies.AssertQueue,
    private options: AmqpStrategyOptions,
  ) {}

  get message$() {
    return this.msgSubject$.asObservable().pipe(
      share(),
      map(message => ({
        data: message.content,
        replyTo: message.properties.replyTo,
        correlationId: message.properties.correlationId,
        raw: message,
      } as TransportMessage<Buffer>))
    );
  }

  get response$() {
    return this.resSubject$.asObservable().pipe(
      share(),
      map(message => ({
        data: message.content,
        replyTo: message.properties.replyTo,
        correlationId: message.properties.correlationId,
        raw: message,
      } as TransportMessage<Buffer>))
    );
  }

  get close$() {
    return fromEvent(this.connection, 'close');
  }

  get error$() {
    return fromEvent<Error>(this.connection, 'error');
  }

  consumeMessage = async () => {
    await this.channel.consume(
      this.options.queue,
      msg => msg && this.msgSubject$.next(msg),
    );
    return this;
  }

  consumeResponse = async () => {
    await this.channel.consume(
      this.responseQueue.queue,
      res => res && this.resSubject$.next(res),
      { noAck: true },
    );
    return this;
  }

  sendMessage = (queue: string, msg: TransportMessage<Buffer>, opts: TransportLayerSendOpts = {}) => {
    const { correlationId, replyTo } = msg;

    switch (opts.type) {
      case 'publish':
        this.channel.assertExchange(queue, 'fanout', { durable: false });
        return of(this.channel.publish(queue, '', msg.data));
      case 'send':
        this.channel.sendToQueue(queue, msg.data, { correlationId, replyTo: this.responseQueue.queue });
        return this.response$.pipe(filter(m => m.correlationId === correlationId));
      default:
        return of(this.channel.sendToQueue(queue, msg.data, { replyTo, correlationId }));
    }
  };

  ack = (msg: any) => this.channel.ack(msg);

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
    const responseQueue = await channel.assertQueue('', { exclusive: true });

    return new AmqpStrategyConnection(
      connection,
      channel,
      responseQueue,
      this.options,
    );
  }
}

export const createAmqpStrategy = (options: AmqpStrategyOptions): TransportLayer =>
  new AmqpStrategy(options);
