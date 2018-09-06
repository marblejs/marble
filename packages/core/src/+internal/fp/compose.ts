type Arity<A, B> = (a: A) => B;

export function compose<A, B>(
  f: Arity<A, B>
): Arity<A, B>;
export function compose<A, B, C> (
  g: Arity<B, C>,
  f: Arity<A, B>
): Arity<A, C>;
export function compose<A, B, C, D> (
  h: Arity<C, D>,
  g: Arity<B, C>,
  f: Arity<A, B>
): Arity<A, D>;
export function compose<A, B, C, D, E> (
  i: Arity<D, E>,
  h: Arity<C, D>,
  g: Arity<B, C>,
  f: Arity<A, B>
): Arity<A, E>;
export function compose<A, B, C, D, E, F> (
  j: Arity<E, F>,
  i: Arity<D, E>,
  h: Arity<C, D>,
  g: Arity<B, C>,
  f: Arity<A, B>
): Arity<A, F>;

export function compose(...fns: Arity<any, any>[]) {
  return fns.reverse().reduce((prevFn, nextFn) =>
    value => nextFn(prevFn(value)),
    value => value
  );
}
