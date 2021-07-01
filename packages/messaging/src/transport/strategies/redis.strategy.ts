import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { Subject, fromEvent, merge, lastValueFrom, Observable } from 'rxjs';
import { map, mapTo, take, tap, share, filter } from 'rxjs/operators';
import { pipe } from 'fp-ts/lib/function';
import { RedisClient, ClientOpts } from 'redis';
import { TransportLayer, TransportLayerConnection, TransportMessage, Transport, DEFAULT_TIMEOUT } from '../transport.interface';
import { throwUnsupportedError } from '../transport.error';
import { RedisStrategyOptions, RedisConnectionStatus } from './redis.strategy.interface';
import * as RedisHelper from './redis.strategy.helper';

type RedisIncomingMsg = {
  content: string;
  channel: string;
};

class RedisStrategyConnection implements TransportLayerConnection<Transport.REDIS> {
  private statusSubject$ = new Subject<RedisConnectionStatus>();
  private producerSubject = new Subject<RedisIncomingMsg>();
  private consumerSubject = new Subject<RedisIncomingMsg>();
  private closeSubject$ = new Subject();

  constructor(
    isConsumer: boolean,
    private opts: RedisStrategyOptions,
    private publisher: RedisClient,
    private subscriber: RedisClient,
    private rpcSubscriber: RedisClient,
  ) {
    if (isConsumer) {
      subscriber.on('message', (channel, content) => this.consumerSubject.next({ content, channel }));
    } else {
      rpcSubscriber.on('message', (channel, content) => this.producerSubject.next({ content, channel }));
    }

    process.nextTick(() => this.statusSubject$.next(RedisConnectionStatus.CONNECT));
  }

  get type() {
    return Transport.REDIS as const;
  }

  get config() {
    return {
      timeout: this.opts.timeout ?? DEFAULT_TIMEOUT,
      channel: this.opts.channel,
      raw: this.opts,
    };
  }

  get status$() {
    const ready$ = pipe(
      merge(fromEvent(this.subscriber, 'ready')),
      mapTo(RedisConnectionStatus.READY));

    const connect$ = pipe(
      merge(fromEvent(this.subscriber, 'connect')),
      mapTo(RedisConnectionStatus.CONNECT));

    const reconnecting$ = pipe(
      merge(fromEvent(this.subscriber, 'reconnecting')),
      mapTo(RedisConnectionStatus.RECONNECTING));

    const end$ = pipe(
      merge(fromEvent(this.subscriber, 'end')),
      mapTo(RedisConnectionStatus.END));

    return pipe(
      merge(ready$, connect$, reconnecting$, end$, this.statusSubject$.asObservable()),
      share(),
    );
  }

  get close$() {
    return this.closeSubject$.asObservable();
  }

  get error$() {
    return pipe(
      merge(
        fromEvent(this.publisher, 'error') as Observable<Error>,
        fromEvent(this.subscriber, 'error') as Observable<Error>,
        fromEvent(this.rpcSubscriber, 'error') as Observable<Error>,
      ),
      share(),
    );
  }

  get message$() {
    return pipe(
      this.consumerSubject.asObservable(),
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

    return lastValueFrom(pipe(
      this.producerSubject.asObservable(),
      filter(msg => msg.channel === replyChannel),
      take(1),
      tap(() => RedisHelper.unsubscribeChannel(this.rpcSubscriber)(replyChannel)),
      map(msg => RedisHelper.decodeMessage(msg.content)),
    ));
  }

  close = async () => {
    this.subscriber.removeAllListeners('message');

    await Promise.all([
      RedisHelper.quitClient(this.publisher),
      RedisHelper.quitClient(this.subscriber),
      RedisHelper.quitClient(this.rpcSubscriber),
    ]);

    this.closeSubject$.next(null);
  }

  ackMessage = () => throwUnsupportedError('Redis')('ackMessage');

  nackMessage = () => throwUnsupportedError('Redis')('nackMessage');

  getChannel = () => this.opts.channel;
}

class RedisStrategy implements TransportLayer<Transport.REDIS> {
  constructor(private options: RedisStrategyOptions) {}

  get type() {
    return Transport.REDIS as const;
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
    const { channel } = this.options;

    const isConsumer = !!data?.isConsumer;
    const publisher = await RedisHelper.connectClient(this.clientOpts);
    const subscriber = await RedisHelper.connectClient(this.clientOpts);
    const rpcSubscriber = await RedisHelper.connectClient(this.clientOpts);

    if (isConsumer) {
      await RedisHelper.subscribeChannel(subscriber)(channel);
    }

    return new RedisStrategyConnection(
      isConsumer,
      this.options,
      publisher,
      subscriber,
      rpcSubscriber,
    );
  }
}

export const createRedisStrategy = (options: RedisStrategyOptions): TransportLayer<Transport.REDIS> =>
  new RedisStrategy(options);
