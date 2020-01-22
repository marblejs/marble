import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/lib/Option';

export const isNonNullable = <T>(value: T): value is NonNullable<T> =>
  value !== undefined && value !== null;

export const isNullable = <T>(value: T) =>
  !isNonNullable(value);

export const isTestEnv = () =>
  process.env.NODE_ENV === 'test';

export const getPortEnv = () => pipe(
  O.fromNullable(process.env.PORT),
  O.map(Number),
  O.toUndefined,
);
