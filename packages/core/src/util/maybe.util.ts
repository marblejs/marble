export interface Functor<T> {
  map<R>(f: (value: T) => R): Functor<R>;
  flatMap<R>(f: (value: T) => Functor<R>): Functor<R>;
}

export interface MaybeCases<T, U> {
  some: (t: T) => U;
  none: () => U;
}

export class Maybe<T> implements Functor<T> {
  private constructor(private value: T | null | undefined) {}

  private static some = <T>(value: T) => new Maybe(value);

  private static none = <T>() => new Maybe<T>(null);

  static of = <T>(value: T) =>
    value
      ? Maybe.some(value)
      : Maybe.none<T>()

  map = <R>(f: (value: T) => R): Maybe<R> =>
    this.value
      ? Maybe.some(f(this.value))
      : Maybe.none<R>()

  flatMap = <R>(f: (value: T) => Maybe<R>): Maybe<R> =>
    this.value
      ? f(this.value)
      : Maybe.none<R>()

  caseOf = <U>(cases: MaybeCases<T, U>) =>
    this.value
      ? cases.some(this.value)
      : cases.none()

  valueOr = (defaultValue: T): T =>
    this.value
      ? this.value
      : defaultValue

  valueOrCompute = <R extends T>(f: () => R): T|R =>
    this.value
      ? this.value
      : f()

  valueOrThrow(error?: Error): T {
    if (!this.value) {
      throw (error || new Error('No value is available'));
    }

    return this.value;
  }
}
