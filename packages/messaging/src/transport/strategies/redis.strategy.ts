import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { Subject, fromEvent, merge } from 'rxjs';
import { map, mapTo, take } from 'rxjs/operators';
import { RedisClient, ClientOpts } from 'redis';
import { TransportLayer, TransportLayerConnection, TransportMessage } from '../transport.interface';
import { RedisStrategyOptions, RedisConnectionStatus } from './redis.strategy.interface';
import { quitRedisClient, subscribeRedisChannel, encodeMessage, decodeMessage, unsubscribeRedisChannel, connectRedisClient } from './redis.strategy.helper';

class RedisStrategyConnection implements TransportLayerConnection {
  private msgSubject$ = new Subject<{ content: string }>();
  private closeSubject$ = new Subject();

  constructor(
    private opts: { channel: string; isConsumer: boolean },
    private publisher: RedisClient,
    private subscriber: RedisClient,
    private rpcSubscriber: RedisClient,
  ) {
    if (opts.isConsumer) {
      subscriber.on('message', (_, msg) => this.msgSubject$.next({ content: msg }));
    }
  }

  get status$() {
    const ready$ = merge(fromEvent(this.subscriber, 'ready'), fromEvent(this.publisher, 'ready'))
      .pipe(mapTo(RedisConnectionStatus.READY));

    const connect$ = merge(fromEvent(this.subscriber, 'connect'), fromEvent(this.publisher, 'connect'))
      .pipe(mapTo(RedisConnectionStatus.CONNECT));

    const reconnecting$ = merge(fromEvent(this.subscriber, 'reconnecting'), fromEvent(this.publisher, 'reconnecting'))
      .pipe(mapTo(RedisConnectionStatus.RECONNECTING));

    const end$ = merge(fromEvent(this.subscriber, 'end'), fromEvent(this.publisher, 'end'))
      .pipe(mapTo(RedisConnectionStatus.END));

    return merge(ready$, connect$, reconnecting$, end$);
  }

  get close$() {
    return this.closeSubject$.asObservable();
  }

  get error$() {
    return merge(
      fromEvent<Error>(this.publisher, 'error'),
      fromEvent<Error>(this.subscriber, 'error'),
    );
  }

  get message$() {
    return this.msgSubject$.asObservable().pipe(
      map(msg => decodeMessage(msg.content)),
    );
  }

  emitMessage = async (channel: string, message: TransportMessage<Buffer>) =>
    new Promise<boolean>((res, rej) => {
      const replyChannel = message.correlationId;
      const encodedMessage = encodeMessage(replyChannel)(message.data);
      this.publisher.publish(channel, encodedMessage, err => err ? rej(false) : res(true));
    });

  sendMessage = async (channel: string, message: TransportMessage<Buffer>) => {
    const rpcSubject$ = new Subject<{ content: string }>();
    const correlationId = createUuid();
    const replyChannel = correlationId;

    message.correlationId = correlationId;

    this.rpcSubscriber.expire(replyChannel, 1);

    await subscribeRedisChannel(this.rpcSubscriber)(replyChannel);

    this.rpcSubscriber.on('message', async (ch, msg) => {
      if (ch === replyChannel) {
        rpcSubject$.next({ content: msg });
        await unsubscribeRedisChannel(this.rpcSubscriber)(replyChannel);
      }
    });

    await this.emitMessage(channel, message);

    return rpcSubject$.asObservable().pipe(
      take(1),
      map(msg => decodeMessage(msg.content)),
    ).toPromise();
  }

  ackMessage = () => {
    throw new Error('Unsupported'); // @TODO
  }

  nackMessage = () => {
    throw new Error('Unsupported'); // @TODO
  }

  close = async () => {
    await Promise.all([
      quitRedisClient(this.publisher),
      quitRedisClient(this.subscriber),
    ]);

    this.closeSubject$.next();
  }

  getChannel = () => this.opts.channel;
}

class RedisStrategy implements TransportLayer {
  constructor(private options: RedisStrategyOptions) {}

  get config() {
    return ({
      host: this.options.host,
      channel: this.options.channel,
    });
  }

  get clientOpts(): ClientOpts {
    const { host, port, password } = this.options;
    return { url: host, port, password };
  }

  async connect(data: { isConsumer: boolean }) {
    const { isConsumer } = data;
    const { channel } = this.options;

    await import('redis');

    const publisher = await connectRedisClient(this.clientOpts);
    const subscriber = await connectRedisClient(this.clientOpts);
    const rpcSubscriber = await connectRedisClient(this.clientOpts);

    publisher.expire(channel, 1);

    if (data.isConsumer) {
      subscriber.expire(channel, 1);
      await subscribeRedisChannel(subscriber)(channel);
    }

    return new RedisStrategyConnection({ isConsumer, channel }, publisher, subscriber, rpcSubscriber);
  }
}

export const createRedisStrategy = (options: RedisStrategyOptions): TransportLayer =>
  new RedisStrategy(options);
