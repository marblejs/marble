import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { TransportLayer, TransportLayerConnection } from '../transport.interface';
import { createLocalStrategy } from './local.strategy';

class LocalStrategyProvider implements TransportLayer {
  private static instance: LocalStrategyProvider;
  private readonly strategy: TransportLayer;
  private readonly strategyConnection: Promise<TransportLayerConnection>;

  private constructor() {
    this.strategy = createLocalStrategy({});
    this.strategyConnection = this.strategy.connect();
  }

  static getDefault = () => pipe(
    O.fromNullable(LocalStrategyProvider.instance),
    O.getOrElse(() => LocalStrategyProvider.instance = new LocalStrategyProvider()),
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

export const provideLocalStrategy = () => LocalStrategyProvider.getDefault();
