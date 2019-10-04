import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/lib/Option';
import { ContextToken } from './context.token.factory';
import { ContextProvider } from './context.factory';
import { ContextError } from '../error/error.model';
import { coreErrorFactory, CoreErrorOptions } from '../error/error.factory';

const coreErrorOptions: CoreErrorOptions =  { contextMethod: 'useContext', offset: 2 };

export const useContext = <T>(token: ContextToken<T>) => (ask: ContextProvider) => pipe(
  ask(token),
  O.fold(
    () => {
      const message = `Cannot resolve "${token.name || token._id}" context token.`;
      const detail = `You've probably forgot to register the bound token in the app context.`;
      const error = new ContextError(`${message} ${detail}`);
      const coreError = coreErrorFactory(error.message, coreErrorOptions)

      console.error(coreError.stack);

      throw error;
    },
    dep => dep,
  ),
);
