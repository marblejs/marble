import { RouteEffect } from './router.interface';
import { HttpMethod } from '../http.interface';
import { HttpMiddlewareEffect, HttpEffect } from '../effects/http-effects.interface';
import { combineMiddlewares } from '../effects/effects.combiner';

type Ready = 'Ready';
type Empty = 'Empty';
type PathApplied = 'PathApplied';
type TypeApplied = 'TypeApplied';
type MiddlewareApplied = 'MiddlewareApplied';
type EffectApplied = 'EffectApplied';
type MetaApplied = 'MetaApplied';

type RouteEffectSpec = Partial<RouteEffect>;

export class IxRouteBuilder<I, O, A> {
  readonly _A: A | undefined;
  readonly _L: O | undefined;
  readonly _U: I | undefined;

  constructor(readonly spec: A) {}

  run(): A {
    return this.spec;
  }

  ichain<Z, B>(f: (a: A) => IxRouteBuilder<O, Z, B>): IxRouteBuilder<I, Z, B> {
    return new IxRouteBuilder(f(this.spec).run());
  }
}

export const ichain = <I, O, Z, A, B>
  (f: (a: A) => IxRouteBuilder<O, Z, B>) =>
  (fa: IxRouteBuilder<I, O, A>): IxRouteBuilder<I, Z, B> => {
    return fa.ichain(f);
};

type Arity<A, B> = (a: A) => B;

function pipe<A, B>(
  f1: Arity<A, B>
): RouteEffect;
function pipe<A, B, C> (
  f1: Arity<A, B>,
  f2: Arity<B, C>,
): RouteEffect;
function pipe<A, B, C, D> (
  f1: Arity<A, B>,
  f2: Arity<B, C>,
  f3: Arity<C, D>,
): RouteEffect;
function pipe<A, B, C, D, E> (
  f1: Arity<A, B>,
  f2: Arity<B, C>,
  f3: Arity<C, D>,
  f4: Arity<D, E>,
): RouteEffect;
function pipe<A, B, C, D, E, F> (
  f1: Arity<A, B>,
  f2: Arity<B, C>,
  f3: Arity<C, D>,
  f4: Arity<D, E>,
  f5: Arity<E, F>,
): RouteEffect;
function pipe<A, B, C, D, E, F, G> (
  f1: Arity<A, B>,
  f2: Arity<B, C>,
  f3: Arity<C, D>,
  f4: Arity<D, E>,
  f5: Arity<E, F>,
  f6: Arity<F, G>,
): RouteEffect;
function pipe<A, B, C, D, E, F, G, H> (
  f1: Arity<A, B>,
  f2: Arity<B, C>,
  f3: Arity<C, D>,
  f4: Arity<D, E>,
  f5: Arity<E, F>,
  f6: Arity<F, G>,
  f7: Arity<G, H>,
): RouteEffect;
function pipe<A, B, C, D, E, F, G, H, I> (
  f1: Arity<A, B>,
  f2: Arity<B, C>,
  f3: Arity<C, D>,
  f4: Arity<D, E>,
  f5: Arity<E, F>,
  f6: Arity<F, G>,
  f7: Arity<G, H>,
  f8: Arity<H, I>,
): RouteEffect;
function pipe<A, B, C, D, E, F, G, H, I, J> (
  f1: Arity<A, B>,
  f2: Arity<B, C>,
  f3: Arity<C, D>,
  f4: Arity<D, E>,
  f5: Arity<E, F>,
  f6: Arity<F, G>,
  f7: Arity<G, H>,
  f8: Arity<H, I>,
  f9: Arity<I, J>,
): RouteEffect;
function pipe<A, B, C, D, E, F, G, H, I, J, K> (
  f1: Arity<A, B>,
  f2: Arity<B, C>,
  f3: Arity<C, D>,
  f4: Arity<D, E>,
  f5: Arity<E, F>,
  f6: Arity<F, G>,
  f7: Arity<G, H>,
  f8: Arity<H, I>,
  f9: Arity<I, J>,
  f10: Arity<J, K>,
): RouteEffect;
function pipe(
  ...fns: Array<Arity<
    IxRouteBuilder<any, any, any>,
    IxRouteBuilder<any, any, any>
  >>
): RouteEffect {
  return fns.reduce(
    (prevFn, nextFn) => value => nextFn(prevFn(value)),
    value => value,
  )(route).run();
}

const route =
  new IxRouteBuilder<Ready, Empty, RouteEffectSpec>({});

const matchPath = (path: string) => ichain((spec: RouteEffectSpec) =>
  new IxRouteBuilder<Empty, PathApplied, RouteEffectSpec>({ ...spec, path }));

const matchType = (method: HttpMethod) => ichain((spec: RouteEffectSpec) =>
  new IxRouteBuilder<PathApplied, TypeApplied, RouteEffectSpec>({ ...spec, method }));

const use = (middleware: HttpMiddlewareEffect) => ichain((spec: RouteEffectSpec) =>
  new IxRouteBuilder<TypeApplied | MiddlewareApplied, MiddlewareApplied, RouteEffectSpec>({
    ...spec,
    middleware: spec.middleware
      ? combineMiddlewares(spec.middleware, middleware)
      : middleware
  }));

const useEffect = (effect: HttpEffect) => ichain((spec: RouteEffectSpec) =>
  new IxRouteBuilder<TypeApplied | MiddlewareApplied, EffectApplied, RouteEffectSpec>({ ...spec, effect }));

const applyMeta = (meta: Record<string, any>) => ichain((spec: RouteEffectSpec) =>
  new IxRouteBuilder<EffectApplied | MetaApplied, MetaApplied, RouteEffectSpec>({
    ...spec,
    meta: { ...spec.meta, ...meta },
  }));

export const r = { matchPath, matchType, use, useEffect, applyMeta, pipe };
