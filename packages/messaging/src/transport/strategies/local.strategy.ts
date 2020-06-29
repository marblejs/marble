import { Subject, EMPTY } from 'rxjs';
import { share, take, filter } from 'rxjs/operators';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { TransportLayer, TransportLayerConnection, TransportMessage, Transport, DEFAULT_TIMEOUT, TransportLayerConfig } from '../transport.interface';
import { throwUnsupportedError } from '../transport.error';
import { LocalStrategyOptions, EVENT_BUS_CHANNEL } from './local.strategy.interface';

class LocalStrategyConnection implements TransportLayerConnection<Transport.LOCAL> {
  private errorSubject$ = new Subject<Error>();
  private rpcSubject$ = new Subject<TransportMessage<Buffer>>();
  private msgSubject$ = new Subject<TransportMessage<Buffer>>();
  private closeSubject$ = new Subject();

  constructor(private opts: TransportLayerConfig) { }

  get type() {
    return Transport.LOCAL as const;
  }

  get config() {
    return {
      timeout: this.opts.timeout,
      channel: this.opts.channel,
      raw: this.opts,
    };
  }

  get status$() {
    return EMPTY;
  }

  get close$() {
    return this.closeSubject$.asObservable().pipe(
      share(),
    );
  }

  get error$() {
    return this.errorSubject$.asObservable().pipe(
      share(),
    );
  }

  get message$() {
    return this.msgSubject$.asObservable().pipe(
      share(),
    );
  }

  emitMessage = async (channel: string, message: TransportMessage<Buffer>) => {
    if (channel && channel !== this.opts.channel) {
      this.rpcSubject$.next(message);
    } else {
      this.msgSubject$.next(message);
    }

    return true;
  }

  sendMessage = async (channel: string, message: TransportMessage<Buffer>) => {
    const correlationId = createUuid();
    const replyChannel = correlationId;

    message.replyTo = replyChannel;
    message.correlationId = correlationId;

    setImmediate(() => this.msgSubject$.next(message));

    return this.rpcSubject$
      .asObservable()
      .pipe(filter(msg => msg.replyTo === replyChannel && msg.correlationId === correlationId))
      .pipe(take(1))
      .toPromise();
  }

  close = async () => {
    this.closeSubject$.next();
  }

  ackMessage = () => throwUnsupportedError('LOCAL')('ackMessage');

  nackMessage = () => throwUnsupportedError('LOCAL')('nackMessage');

  getChannel = () => this.opts.channel;
}

class LocalStrategy implements TransportLayer<Transport.LOCAL> {
  constructor(private options: LocalStrategyOptions) {}

  get type() {
    return Transport.LOCAL as Transport.LOCAL;
  }

  get config() {
    return ({
      host: 'localhost',
      channel: EVENT_BUS_CHANNEL,
      timeout: this.options.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  async connect() {
    return new LocalStrategyConnection(this.config);
  }
}

export const createLocalStrategy = (options: LocalStrategyOptions): TransportLayer<Transport.LOCAL> =>
  new LocalStrategy(options);
