import { combineMiddlewares } from '@marblejs/core';
import { IxBuilder, ichainCurry } from '@marblejs/core/dist/+internal/fp/IxBuilder';
import { HttpMiddlewareEffect, HttpEffect } from '../effects/http.effects.interface';
import { HttpMethod } from '../http.interface';
import { RouteEffect, RouteMeta } from './http.router.interface';

type Ready = 'Ready';
type Empty = 'Empty';
type PathApplied = 'PathApplied';
type TypeApplied = 'TypeApplied';
type MiddlewareApplied = 'MiddlewareApplied';
type EffectApplied = 'EffectApplied';
type MetaApplied = 'MetaApplied';

type RouteEffectSpec = Partial<RouteEffect>;

type Arity<A, B> = (a: A) => B;

const route =
  new IxBuilder<Ready, Empty, RouteEffectSpec>({});

const matchPath = (path: string) => ichainCurry((spec: RouteEffectSpec) =>
  new IxBuilder<Empty | MetaApplied, PathApplied, RouteEffectSpec>({ ...spec, path }));

const matchType = (method: HttpMethod) => ichainCurry((spec: RouteEffectSpec) =>
  new IxBuilder<PathApplied, TypeApplied, RouteEffectSpec>({ ...spec, method }));

const use = (middleware: HttpMiddlewareEffect) => ichainCurry((spec: RouteEffectSpec) =>
  new IxBuilder<TypeApplied | MiddlewareApplied, MiddlewareApplied, RouteEffectSpec>({
    ...spec,
    middleware: spec.middleware
      ? combineMiddlewares(spec.middleware, middleware)
      : middleware
  }));

const useEffect = (effect: HttpEffect) => ichainCurry((spec: RouteEffectSpec) =>
  new IxBuilder<TypeApplied | MiddlewareApplied, EffectApplied, RouteEffectSpec>({ ...spec, effect }));

const applyMeta = (meta: RouteMeta) => ichainCurry((spec: RouteEffectSpec) =>
  new IxBuilder<EffectApplied | MetaApplied, MetaApplied, RouteEffectSpec>({
    ...spec,
    meta: { ...spec.meta, ...meta },
  }));

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
  ...fns: Arity<IxBuilder<any, any, any>, IxBuilder<any, any, any>>[]
): RouteEffect {
  return fns.reduce(
    (prevFn, nextFn) => value => nextFn(prevFn(value)),
    value => value,
  )(route).run();
}

export const r = { matchPath, matchType, use, useEffect, applyMeta, pipe };
