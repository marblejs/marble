import { UnaryFunction } from 'rxjs';
import { pipe, identity } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import { isString } from './string.util';

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

export const wait = (seconds = 1): Promise<unknown> =>
  new Promise(res => {
    setTimeout(() => res(undefined), seconds * 1000);
  });

export const bufferFrom = (data: any): Buffer =>
  Buffer.from(data);

export const stringifyJson = (data: any): string =>
  !isString(data) ? JSON.stringify(data) : data;

export const parseJson = (data: any) =>
  pipe(
    E.tryCatch(
      () => JSON.parse(data),
      () => data),
    E.fold(identity, identity),
  );

export const pipeFromArray = <T, R>(fns: Array<UnaryFunction<T, R>>): UnaryFunction<T, R> => {
  if (fns.length === 0)
    return identity as UnaryFunction<any, any>;

  if (fns.length === 1)
    return fns[0];

  return function piped(input: T): R {
    return fns.reduce((prev: any, fn: UnaryFunction<T, R>) => fn(prev), input as any);
  };
};
