import { pipe } from 'fp-ts/lib/pipeable';
import { logger, LoggerToken, mockLogger } from '../logger';
import { isTestEnv } from '../+internal/utils';
import { registerAll, BoundDependency, createContext, bindTo, resolve, Context } from './context';

/**
 * Constructs and resolves a new or derived context based on provided dependencies
 * @param context (optional) empty or derived context
 * @param dependencies list of bound dependencies to register in the context
 * @since v3.4.0
 */
export const constructContext = (context?: Context) => (...dependencies: BoundDependency<any>[]) =>
  pipe(
    context ?? createContext(),
    registerAll([
      bindTo(LoggerToken)(isTestEnv() ? mockLogger : logger),
      ...dependencies,
    ]),
    resolve,
  );

/**
 * Constructs and resolves a new context based on provided dependencies
 * @param dependencies list of bound dependencies to register in the context
 * @since v3.2.0
 */
export const contextFactory = constructContext();
