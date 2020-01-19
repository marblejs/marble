import { Subject, fromEvent, merge, from } from 'rxjs';
import { map, filter, take, mapTo, first, mergeMap, share } from 'rxjs/operators';
import { Channel, ConsumeMessage, Replies } from 'amqplib';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { TransportLayer, TransportMessage, TransportLayerConnection, Transport, DEFAULT_TIMEOUT } from '../transport.interface';
import { AmqpStrategyOptions, AmqpConnectionStatus } from './amqp.strategy.interface';

class AmqpStrategyConnection implements TransportLayerConnection {
  private closeSubject$ = new Subject();

  constructor(
    private msgSubject$: Subject<ConsumeMessage>,
    private connectionManager: AmqpConnectionManager,
    private channelWrapper: ChannelWrapper,
    private options: AmqpStrategyOptions,
  ) {}

  get close$() {
    return this.closeSubject$.asObservable();
  }

  get error$() {
    return fromEvent<Error>(this.channelWrapper, 'error');
  }

  get status$() {
    const connect$ = fromEvent(this.connectionManager, 'connect')
      .pipe(mapTo(AmqpConnectionStatus.CONNECTED));

    const connectChannel$ = fromEvent(this.channelWrapper, 'connect')
      .pipe(mapTo(AmqpConnectionStatus.CHANNEL_CONNECTED));

    const diconnect$ = fromEvent(this.connectionManager, 'disconnect')
      .pipe(mapTo(AmqpConnectionStatus.CONNECTION_LOST));

    const diconnectChannel$ = fromEvent(this.channelWrapper, 'close')
      .pipe(mapTo(AmqpConnectionStatus.CHANNEL_CONNECTION_LOST));

    return merge(connect$, connectChannel$, diconnect$, diconnectChannel$);
  }

  get message$() {
    return this.msgSubject$.asObservable().pipe(
      share(),
      map(raw => ({
        data: raw.content,
        replyTo: raw.properties.replyTo,
        correlationId: raw.properties.correlationId,
        raw,
      } as TransportMessage<Buffer>)),
    );
  }

  sendMessage = async (queue: string, msg: TransportMessage<Buffer>) => {
    const { data } = msg;
    const correlationId = createUuid();
    const timeout = this.options.timeout ?? DEFAULT_TIMEOUT;
    const replyToSubject = new Subject<string>();
    const resSubject$ = new Subject<{ msg: ConsumeMessage; tag: string }>();

    replyToSubject
      .pipe(first())
      .subscribe(async replyTo => {
        await this.channelWrapper.sendToQueue(queue, data, {
          correlationId,
          replyTo,
        });
      });

    await this.channelWrapper.addSetup(async (channel: Channel) => {
      const replyQueue = await channel.assertQueue('', {
        exclusive: true,
        autoDelete: true,
        expires: timeout,
      });

      const consumer: Replies.Consume = await channel.consume(
        replyQueue.queue,
        msg => msg && resSubject$.next({ msg, tag: consumer.consumerTag }),
        { noAck: true },
      );

      setTimeout(() => {
        channel
          .cancel(consumer.consumerTag)
          .catch(error => resSubject$.error(error));
      }, timeout);

      replyToSubject.next(replyQueue.queue);
    });

    return resSubject$.asObservable().pipe(
      filter(raw => raw.msg.properties.correlationId === correlationId),
      take(1),
      mergeMap(raw => from(this.channelWrapper.addSetup((channel: Channel) => channel.cancel(raw.tag))).pipe(
        mapTo(({
          data: raw.msg.content,
          replyTo: raw.msg.properties.replyTo,
          correlationId: raw.msg.properties.correlationId,
          raw,
        } as TransportMessage<Buffer>)),
      )),
    ).toPromise();
  };

  emitMessage = async (queue: string, msg: TransportMessage<Buffer>) => {
    const { correlationId, data, replyTo } = msg;

    await this.channelWrapper.sendToQueue(queue, data, {
      replyTo,
      correlationId,
    });

    return true;
  };

  ackMessage = (msg: TransportMessage | undefined) => {
    if (msg) {
      this.channelWrapper.ack(msg.raw);
    }
  }

  nackMessage = (msg: TransportMessage | undefined, resend = true) => {
    if (msg) {
      this.channelWrapper.nack(msg.raw, false , resend);
    }
  }

  getChannel = () => this.options.queue;

  close = async () => {
    await this.channelWrapper.close();
    await this.connectionManager.close();
    this.closeSubject$.next();
  }
}

class AmqpStrategy implements TransportLayer {
  constructor(private options: AmqpStrategyOptions) {}

  get type() {
    return Transport.AMQP;
  }

  get config() {
    return ({
      host: this.options.host,
      channel: this.options.queue,
      timeout: this.options.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  async connect(opts: { isConsumer: boolean }) {
    const { host, queue, queueOptions, prefetchCount } = this.options;
    const msgSubject$ = new Subject<ConsumeMessage>();

    await import('amqplib');

    const amqplib = await import('amqp-connection-manager');
    const connectionManager = await amqplib.connect([host]);

    const channelWrapper = connectionManager.createChannel({
      json: false,
      setup: async (channel: Channel) => {
        await channel.prefetch(prefetchCount || 1);
        await channel.assertQueue(queue, queueOptions);

        if (opts.isConsumer) {
          await channel.consume(
            this.options.queue,
            msg => msg && msgSubject$.next(msg),
            { noAck: this.options.expectAck !== undefined
              ? !this.options.expectAck
              : true },
          )
        }
      },
    });

    return new AmqpStrategyConnection(
      msgSubject$,
      connectionManager,
      channelWrapper,
      this.options,
    );
  }
}

export const createAmqpStrategy = (options: AmqpStrategyOptions): TransportLayer =>
  new AmqpStrategy(options);
