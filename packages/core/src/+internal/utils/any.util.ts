import { pipe } from 'fp-ts/lib/pipeable';
import { identity } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import * as qs from 'qs';
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

export const transformUrlEncoded = (data: any): string =>
  !isString(data) ? qs.stringify(data) : data;

export const stringifyJson = (data: any): string =>
  !isString(data) ? JSON.stringify(data) : data;

export const parseJson = (data: any) =>
  pipe(
    E.tryCatch(
      () => JSON.parse(data),
      () => data),
    E.fold(identity, identity),
  );
