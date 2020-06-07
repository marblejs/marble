import { fromNullable } from 'fp-ts/lib/Option';

export const getArrayFromEnum = (E: Record<string, unknown>) =>
  Object.keys(E).filter(key => typeof E[key as any] === 'number');

export const getHead = <T>(array: T[]) =>
  fromNullable(array[0]);

export const getLast = <T>(array: T[]) =>
  fromNullable(array[array.length - 1]);

export const filterArray = <T>(f: (v: T) => boolean) => (array: T[]) =>
  array.filter(f);

export const mapArray = <T, R>(f: (v: T) => R) => (array: T[]) =>
  array.map(f);

export const insertIf = (condition: boolean) => <T>(...elements: T[]) =>
  condition ? elements as NonNullable<T>[] : [];

export const insertIfElse = (condition: boolean) => <T>(...elements: T[]) => <U>(...elseElements: U[]) =>
  condition ? elements as NonNullable<T>[] : elseElements as NonNullable<U>[];
