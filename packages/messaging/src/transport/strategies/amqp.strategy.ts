import { pipe } from 'fp-ts/lib/function';
import { Subject, fromEvent, merge, from, firstValueFrom, Observable } from 'rxjs';
import { map, filter, take, mapTo, first, mergeMap, share, tap } from 'rxjs/operators';
import { Channel, ConsumeMessage, Replies } from 'amqplib';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { TransportLayer, TransportMessage, TransportLayerConnection, Transport, DEFAULT_TIMEOUT } from '../transport.interface';
import { AmqpStrategyOptions, AmqpConnectionStatus, AmqpCannotSetExpectAckForNonConsumerConnection } from './amqp.strategy.interface';

class AmqpStrategyConnection implements TransportLayerConnection<Transport.AMQP> {
  private msgSubject$ = new Subject<ConsumeMessage>();
  private statusSubject$ = new Subject<AmqpConnectionStatus>();
  private errorSubject$ = new Subject<Error>();
  private closeSubject$ = new Subject();

  constructor(
    isConsumer: boolean,
    private opts: AmqpStrategyOptions,
    private connectionManager: AmqpConnectionManager,
    private channelWrapper: ChannelWrapper,
  ) {
    process.nextTick(async () => {
      if (isConsumer) await this.consumeMessages();
      this.statusSubject$.next(AmqpConnectionStatus.CONNECTED);
    });
  }

  get type() {
    return Transport.AMQP as const;
  }

  get config() {
    return {
      timeout: this.opts.timeout ?? DEFAULT_TIMEOUT,
      channel: this.opts.queue,
      raw: this.opts,
    };
  }

  get close$() {
    return this.closeSubject$.asObservable();
  }

  get error$() {
    return merge(
      fromEvent(this.channelWrapper, 'error') as Observable<Error>,
      this.errorSubject$.asObservable(),
    );
  }

  get status$() {
    const connect$ = pipe(
      fromEvent(this.connectionManager, 'connect'),
      mapTo(AmqpConnectionStatus.CONNECTED));

    const connectChannel$ = pipe(
      fromEvent(this.channelWrapper, 'connect'),
      mapTo(AmqpConnectionStatus.CHANNEL_CONNECTED));

    const diconnect$ = pipe(
      fromEvent(this.connectionManager, 'disconnect') as Observable<{ err?: Error }>,
      tap(({ err }) => err && this.errorSubject$.next(err)),
      mapTo(AmqpConnectionStatus.CONNECTION_LOST));

    const diconnectChannel$ = pipe(
      fromEvent(this.channelWrapper, 'close'),
      mapTo(AmqpConnectionStatus.CHANNEL_CONNECTION_LOST));

    return merge(
      connect$,
      connectChannel$,
      diconnect$,
      diconnectChannel$,
      this.statusSubject$.asObservable(),
    );
  }

  get message$() {
    return pipe(
      this.msgSubject$.asObservable(),
      share(),
      map(raw => ({
        data: raw.content,
        replyTo: raw.properties.replyTo,
        correlationId: raw.properties.correlationId,
        raw,
      } as TransportMessage<Buffer>)),
    );
  }

  private consumeMessages = async () =>
    this.channelWrapper.addSetup(async (channel: Channel) => {
      await channel.consume(
        this.opts.queue,
        msg => msg && this.msgSubject$.next(msg),
        { noAck: !this.opts.expectAck },
      );
    });

  sendMessage = async (queue: string, msg: TransportMessage<Buffer>) => {
    const { data } = msg;
    const correlationId = createUuid();
    const timeout = this.opts.timeout ?? DEFAULT_TIMEOUT;
    const replyToSubject = new Subject<string>();
    const resSubject$ = new Subject<{ msg: ConsumeMessage; tag: string }>();

    pipe(
      replyToSubject,
      first()
    ).subscribe(async replyTo => {
      await this.channelWrapper.sendToQueue(queue, data, {
        correlationId,
        replyTo,
      });
    });

    const modifyChannelSetup = async (channel: Channel): Promise<void> => {
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

      setTimeout(async () => await removeChannelSetupForConsumerTag(consumer.consumerTag), timeout);

      replyToSubject.next(replyQueue.queue);
    };

    const removeChannelSetupForConsumerTag = (consumerTag: string): Promise<void> =>
      this.channelWrapper
        .removeSetup(modifyChannelSetup, async (channel: Channel) => channel.cancel(consumerTag))
        .catch(error => resSubject$.error(error));

    await this.channelWrapper.addSetup(modifyChannelSetup);

    return firstValueFrom(pipe(
      resSubject$.asObservable(),
      filter(raw => raw.msg.properties.correlationId === correlationId),
      take(1),
      mergeMap(raw =>
        pipe(
          from(removeChannelSetupForConsumerTag(raw.tag)),
          mapTo(({
            data: raw.msg.content,
            replyTo: raw.msg.properties.replyTo,
            correlationId: raw.msg.properties.correlationId,
            raw,
          } as TransportMessage<Buffer>)),
        )),
    ));
  };

  emitMessage = async (queue: string, msg: TransportMessage<Buffer>) => {
    const { correlationId, data, replyTo } = msg;

    // don't try to emit the message to the same channel if "ack" mode is enabled
    if (this.opts.expectAck && queue === this.getChannel())
      return false;

    await this.channelWrapper.sendToQueue(queue, data, {
      replyTo,
      correlationId,
    });

    return true;
  };

  ackMessage = (msg: TransportMessage | undefined) => {
    if (this.opts.expectAck && msg && !msg.raw.isAcked) {
      this.channelWrapper.ack(msg.raw);
      msg.raw.isAcked = true;
    }
  }

  nackMessage = (msg: TransportMessage | undefined, resend = true) => {
    if (this.opts.expectAck && msg && !msg.raw.isNacked) {
      this.channelWrapper.nack(msg.raw, false , resend);
      msg.raw.isNacked = true;
    }
  }

  getChannel = () => this.opts.queue;

  close = async () => {
    await this.channelWrapper.close();
    await this.connectionManager.close();
    this.closeSubject$.next(null);
  }
}

class AmqpStrategy implements TransportLayer<Transport.AMQP> {
  constructor(private options: AmqpStrategyOptions) {}

  get type() {
    return Transport.AMQP as const;
  }

  get config() {
    return ({
      host: this.options.host,
      channel: this.options.queue,
      timeout: this.options.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  async connect(opts?: { isConsumer: boolean }) {
    const { host, queue, queueOptions, prefetchCount, expectAck } = this.options;
    const isConsumer = !!opts?.isConsumer;

    if (!isConsumer && expectAck)
      throw new AmqpCannotSetExpectAckForNonConsumerConnection();

    await import('amqplib');

    const amqplib = await import('amqp-connection-manager');
    const connectionManager = amqplib.connect([host]);

    const channelWrapper = connectionManager.createChannel({
      json: false,
      setup: async (channel: Channel) => {
        await channel.prefetch(prefetchCount || 1);
        await channel.assertQueue(queue, queueOptions);
      },
    });

    await (channelWrapper as any).waitForConnect(); // not available in @types/amqp-connection-manager

    return new AmqpStrategyConnection(
      isConsumer,
      this.options,
      connectionManager,
      channelWrapper,
    );
  }
}

export const createAmqpStrategy = (options: AmqpStrategyOptions): TransportLayer<Transport.AMQP> =>
  new AmqpStrategy(options);
