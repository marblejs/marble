import { Maybe } from '../fp/maybe';

export const getArrayFromEnum = (E: Object) =>
  Object.keys(E).filter(key => typeof E[key as any] === 'number');

export const getHead = <T>(array: T[]) =>
  Maybe.of(array[0]);

export const getLast = <T>(array: T[]) =>
  Maybe.of(array[array.length - 1]);

export const filterArray = <T>(f: (v: T) => boolean) => (array: T[]) =>
  array.filter(f);

export const mapArray = <T, R>(f: (v: T) => R) => (array: T[]) =>
  array.map(f);
