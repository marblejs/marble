import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { TransportLayer, TransportLayerConnection, Transport } from '../transport.interface';
import { createLocalStrategy } from './local.strategy';
import { LocalStrategyOptions } from './local.strategy.interface';

export class LocalStrategyProvider implements TransportLayer<Transport.LOCAL> {
  private static instance: LocalStrategyProvider;
  private readonly strategy: TransportLayer<Transport.LOCAL>;
  private readonly strategyConnection: Promise<TransportLayerConnection<Transport.LOCAL>>;

  private constructor(options: LocalStrategyOptions) {
    this.strategy = createLocalStrategy(options);
    this.strategyConnection = this.strategy.connect();
  }

  static getDefault = (options: LocalStrategyOptions) => pipe(
    O.fromNullable(LocalStrategyProvider.instance),
    O.getOrElse(() => LocalStrategyProvider.instance = new LocalStrategyProvider(options)),
  );

  async connect() {
    return this.strategyConnection;
  }

  get type() {
    return this.strategy.type;
  }

  get config() {
    return this.strategy.config;
  }
}

export const provideLocalStrategy = (options: LocalStrategyOptions) => LocalStrategyProvider.getDefault(options);
