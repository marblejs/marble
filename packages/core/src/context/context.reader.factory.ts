import { pipe } from 'fp-ts/lib/function';
import * as R from 'fp-ts/lib/Reader';
import { ContextProvider, reader } from './context';

export type ReaderHandler<T> = (ask: ContextProvider) => T;

export const createReader = <T>(handler: ReaderHandler<T>) =>
  pipe(reader, R.map(handler));
