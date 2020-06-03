import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { Subject, fromEvent, merge } from 'rxjs';
import { map, mapTo, take, tap, share, filter } from 'rxjs/operators';
import { RedisClient, ClientOpts } from 'redis';
import { TransportLayer, TransportLayerConnection, TransportMessage, Transport, DEFAULT_TIMEOUT } from '../transport.interface';
import { throwUnsupportedError } from '../transport.error';
import { RedisStrategyOptions, RedisConnectionStatus } from './redis.strategy.interface';
import * as RedisHelper from './redis.strategy.helper';

type RedisIncomingMsg = {
  content: string;
  channel: string;
};

class RedisStrategyConnection implements TransportLayerConnection {
  private statusSubject$ = new Subject<RedisConnectionStatus>();
  private producerSubject = new Subject<RedisIncomingMsg>();
  private consumerSubject = new Subject<RedisIncomingMsg>();
  private closeSubject$ = new Subject();

  constructor(
    private opts: { channel: string; isConsumer: boolean; timeout: number },
    private publisher: RedisClient,
    private subscriber: RedisClient,
    private rpcSubscriber: RedisClient,
  ) {
    if (opts.isConsumer) {
      subscriber.on('message', (channel, content) => this.consumerSubject.next({ content, channel }));
    } else {
      rpcSubscriber.on('message', (channel, content) => this.producerSubject.next({ content, channel }));
    }

    process.nextTick(() => this.statusSubject$.next(RedisConnectionStatus.CONNECT));
  }

  get status$() {
    const ready$ = merge(fromEvent(this.subscriber, 'ready'))
      .pipe(mapTo(RedisConnectionStatus.READY));

    const connect$ = merge(fromEvent(this.subscriber, 'connect'))
      .pipe(mapTo(RedisConnectionStatus.CONNECT));

    const reconnecting$ = merge(fromEvent(this.subscriber, 'reconnecting'))
      .pipe(mapTo(RedisConnectionStatus.RECONNECTING));

    const end$ = merge(fromEvent(this.subscriber, 'end'))
      .pipe(mapTo(RedisConnectionStatus.END));

    return merge(ready$, connect$, reconnecting$, end$, this.statusSubject$.asObservable()).pipe(
      share(),
    );
  }

  get close$() {
    return this.closeSubject$.asObservable();
  }

  get error$() {
    return merge(
      fromEvent<Error>(this.publisher, 'error'),
      fromEvent<Error>(this.subscriber, 'error'),
      fromEvent<Error>(this.rpcSubscriber, 'error'),
    ).pipe(
      share(),
    );
  }

  get message$() {
    return this.consumerSubject.asObservable().pipe(
      map(msg => RedisHelper.decodeMessage(msg.content)),
    );
  }

  emitMessage = async (channel: string, message: TransportMessage<Buffer>) => {
    const replyChannel = message.correlationId;
    const encodedMessage = RedisHelper.encodeMessage(replyChannel)(message.data);
    return RedisHelper.publishMessage(this.publisher)(channel)(encodedMessage);
  }

  sendMessage = async (channel: string, message: TransportMessage<Buffer>) => {
    const correlationId = createUuid();
    const replyChannel = correlationId;

    message.correlationId = correlationId;

    await RedisHelper.subscribeChannel(this.rpcSubscriber)(replyChannel);
    await this.emitMessage(channel, message);

    return this.producerSubject.asObservable().pipe(
      filter(msg => msg.channel === replyChannel),
      take(1),
      tap(() => RedisHelper.unsubscribeChannel(this.rpcSubscriber)(replyChannel)),
      map(msg => RedisHelper.decodeMessage(msg.content)),
    ).toPromise();
  }

  close = async () => {
    this.subscriber.removeAllListeners('message');

    await Promise.all([
      RedisHelper.quitClient(this.publisher),
      RedisHelper.quitClient(this.subscriber),
      RedisHelper.quitClient(this.rpcSubscriber),
    ]);

    this.closeSubject$.next();
  }

  ackMessage = () => throwUnsupportedError('Redis')('ackMessage');

  nackMessage = () => throwUnsupportedError('Redis')('nackMessage');

  getChannel = () => this.opts.channel;
}

class RedisStrategy implements TransportLayer {
  constructor(private options: RedisStrategyOptions) {}

  get type() {
    return Transport.REDIS;
  }

  get config() {
    return ({
      host: this.options.host,
      channel: this.options.channel,
      timeout: this.options.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  get clientOpts(): ClientOpts {
    const { host, port, password } = this.options;
    return { url: host, port, password };
  }

  async connect(data?: { isConsumer: boolean }) {
    const { channel, timeout } = this.options;

    const isConsumer = !!data?.isConsumer;
    const publisher = await RedisHelper.connectClient(this.clientOpts);
    const subscriber = await RedisHelper.connectClient(this.clientOpts);
    const rpcSubscriber = await RedisHelper.connectClient(this.clientOpts);

    if (isConsumer) {
      await RedisHelper.subscribeChannel(subscriber)(channel);
    }

    return new RedisStrategyConnection({ isConsumer, channel, timeout: timeout ?? DEFAULT_TIMEOUT }, publisher, subscriber, rpcSubscriber);
  }
}

export const createRedisStrategy = (options: RedisStrategyOptions): TransportLayer =>
  new RedisStrategy(options);
