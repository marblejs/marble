import * as T from 'fp-ts/lib/Task';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { constant } from 'fp-ts/lib/function';
import { logger, LoggerToken, mockLogger } from '../logger';
import { isTestEnv } from '../+internal/utils';
import { registerAll, BoundDependency, createContext, bindTo, resolve, Context, lookup, DerivedContextToken, unregister } from './context';
import { ContextToken } from './context.token.factory';

/**
 * `INTERNAL` - unregisters redundant token if available in DerivedContext
 * @since v3.4.0
 */
const unregisterRedundantToken = (token: ContextToken) => (context: Context): Context =>
  pipe(
    lookup(context)(DerivedContextToken),
    O.chain(() => lookup(context)(token)),
    O.fold(
      constant(context),
      () => unregister(token)(context)),
  );

/**
 * Constructs and resolves a new or derived context based on provided dependencies
 * @since v3.4.0
 */
export const constructContext = (context?: Context) => (...dependencies: BoundDependency<any>[]): Promise<Context> =>
  pipe(
    context ?? createContext(),
    registerAll([
      bindTo(LoggerToken)(isTestEnv() ? mockLogger : logger),
      ...dependencies,
    ]),
    context => () => resolve(context),
    T.map(unregisterRedundantToken(LoggerToken)),
  )();

/**
 * Constructs and resolves a new context based on provided dependencies
 * @since v3.2.0
 */
export const contextFactory = constructContext();
