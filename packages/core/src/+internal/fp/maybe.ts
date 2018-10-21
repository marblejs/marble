import { Functor } from './functor';

export type Nullable<T> = T | null | undefined;

export const isNullable = value =>
  value === undefined || value === null;

export interface MaybeCases<T, U> {
  some: (t: T) => U;
  none: () => U;
}

export class Maybe<T> implements Functor<T> {
  private constructor(private value: Nullable<T>) {}

  static some = <T>(value: T) => new Maybe(value);

  static none = <T>() => new Maybe<T>(null);

  static of = <T>(value: Nullable<T>): Maybe<T> =>
    !isNullable(value)
      ? Maybe.some(value as T)
      : Maybe.none<T>()

  map = <R>(f: (value: T) => R): Maybe<R> =>
    !isNullable(this.value)
      ? Maybe.some(f(this.value as T))
      : Maybe.none<R>()

  flatMap = <R>(f: (value: T) => Maybe<R>): Maybe<R> =>
    !isNullable(this.value)
      ? f(this.value as T)
      : Maybe.none<R>()

  caseOf = <U>(cases: MaybeCases<T, U>) =>
    !isNullable(this.value)
      ? cases.some(this.value as T)
      : cases.none()

  valueOr = (defaultValue: T): T =>
    !isNullable(this.value)
      ? this.value as T
      : defaultValue

  valueOrCompute = <R extends T>(f: () => R): T | R =>
    !isNullable(this.value)
      ? this.value as T | R
      : f()

  valueOrThrow(error?: Error): T {
    if (isNullable(this.value)) {
      throw (error || new Error('No value is available'));
    }

    return this.value as T;
  }
}
