export interface Functor<T> {
  map<R>(f: (value: T) => R): Functor<R>;
  flatMap<R>(f: (value: T) => Functor<R>): Functor<R>;
}
