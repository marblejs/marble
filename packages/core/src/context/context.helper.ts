import * as T from 'fp-ts/lib/Task';
import * as O from 'fp-ts/lib/Option';
import * as IO from 'fp-ts/lib/IO';
import { pipe } from 'fp-ts/lib/pipeable';
import { constant } from 'fp-ts/lib/function';
import { logger, LoggerToken, mockLogger } from '../logger';
import { isTestEnv } from '../+internal/utils';
import { registerAll, BoundDependency, createContext, bindTo, resolve, Context, lookup, DerivedContextToken } from './context';
import { ContextToken } from './context.token.factory';

/**
 * `INTERNAL` - unregisters redundant token if available in DerivedContext
 * @since v3.4.0
 */
const unregisterRedundantToken = (token: ContextToken) => (context: Context): IO.IO<Context> => {
  const deleteToken = pipe(
    () => context.delete(token),
    IO.map(constant(context)),
  );

  return pipe(
    lookup(context)(DerivedContextToken),
    O.chain(derivedContext => lookup(derivedContext)(token)),
    O.fold(() => IO.of(context), () => deleteToken),
  );
};

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
    T.chain(context => T.fromIO(unregisterRedundantToken(LoggerToken)(context))),
  )();

/**
 * Constructs and resolves a new context based on provided dependencies
 * @since v3.2.0
 */
export const contextFactory = constructContext();
