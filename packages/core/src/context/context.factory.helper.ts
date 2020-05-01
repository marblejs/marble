import { pipe } from 'fp-ts/lib/pipeable';
import { logger, LoggerToken, mockLogger } from '../logger';
import { isTestEnv } from '../+internal/utils';
import { registerAll, BoundDependency, createContext, bindTo, resolve, Context } from './context.factory';

export const contextFactory = (...dependencies: BoundDependency<any>[]): Promise<Context> =>
  pipe(
    createContext(),
    registerAll([
      bindTo(LoggerToken)(isTestEnv() ? mockLogger : logger),
      ...dependencies,
    ]),
    resolve,
  );
