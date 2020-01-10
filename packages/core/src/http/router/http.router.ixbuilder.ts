import { Observable, OperatorFunction, throwError, of } from 'rxjs';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { pipeFromArray } from 'rxjs/internal/util/pipe';
import { combineMiddlewares } from '../../effects/effects.combiner';
import { IxBuilder, ichainCurry } from '../../+internal/fp/IxBuilder';
import { HttpMiddlewareEffect, HttpEffect, HttpEffectResponse } from '../effects/http.effects.interface';
import { HttpMethod, HttpRequest } from '../http.interface';
import { HttpEffectError } from '../error/http.error.model';
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
  new IxBuilder<Empty, PathApplied, RouteEffectSpec>({ ...spec, path }));

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

type EffectFn = (input$: Observable<HttpRequest>) => Observable<HttpEffectResponse>;

export function handle(): EffectFn;
export function handle<A>(
  op1: OperatorFunction<HttpRequest, A>,
): EffectFn;
export function handle<A, B>(
  op1: OperatorFunction<HttpRequest, A>,
  op2: OperatorFunction<A, B>,
): EffectFn;
export function handle<A, B, C>(
  op1: OperatorFunction<HttpRequest, A>,
  op2: OperatorFunction<A, B>,
  op3: OperatorFunction<B, C>,
): EffectFn;
export function handle<A, B, C, D>(
  op1: OperatorFunction<HttpRequest, A>,
  op2: OperatorFunction<A, B>,
  op3: OperatorFunction<B, C>,
  op4: OperatorFunction<C, D>,
): EffectFn;
export function handle<A, B, C, D, E>(
  op1: OperatorFunction<HttpRequest, A>,
  op2: OperatorFunction<A, B>,
  op3: OperatorFunction<B, C>,
  op4: OperatorFunction<C, D>,
  op5: OperatorFunction<D, E>,
): EffectFn;
export function handle<A, B, C, D, E, F>(
  op1: OperatorFunction<HttpRequest, A>,
  op2: OperatorFunction<A, B>,
  op3: OperatorFunction<B, C>,
  op4: OperatorFunction<C, D>,
  op5: OperatorFunction<D, E>,
  op6: OperatorFunction<E, F>,
): EffectFn;
export function handle<A, B, C, D, E, F, G>(
  op1: OperatorFunction<HttpRequest, A>,
  op2: OperatorFunction<A, B>,
  op3: OperatorFunction<B, C>,
  op4: OperatorFunction<C, D>,
  op5: OperatorFunction<D, E>,
  op6: OperatorFunction<E, F>,
  op7: OperatorFunction<F, G>,
): EffectFn;
export function handle<A, B, C, D, E, F, G, H>(
  op1: OperatorFunction<HttpRequest, A>,
  op2: OperatorFunction<A, B>,
  op3: OperatorFunction<B, C>,
  op4: OperatorFunction<C, D>,
  op5: OperatorFunction<D, E>,
  op6: OperatorFunction<E, F>,
  op7: OperatorFunction<F, G>,
  op8: OperatorFunction<G, H>,
): EffectFn;
export function handle<A, B, C, D, E, F, G, H, I>(
  op1: OperatorFunction<HttpRequest, A>,
  op2: OperatorFunction<A, B>,
  op3: OperatorFunction<B, C>,
  op4: OperatorFunction<C, D>,
  op5: OperatorFunction<D, E>,
  op6: OperatorFunction<E, F>,
  op7: OperatorFunction<F, G>,
  op8: OperatorFunction<G, H>,
  op9: OperatorFunction<H, I>,
  ...operations: OperatorFunction<any, any>[]
): EffectFn;

export function handle(...operators: OperatorFunction<any, any>[]): EffectFn {
  return input$ =>
    input$.pipe(
      mergeMap(request => pipeFromArray([
        ...operators,
        map(res => ({ ...res, request })),
        catchError(error => throwError(new HttpEffectError(error, request))),
      ])(of(request)) as Observable<HttpEffectResponse>),
    );
}

export const r = { matchPath, matchType, use, useEffect, applyMeta, pipe, handle };
