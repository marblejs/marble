import * as R from 'fp-ts/lib/Reader';
import * as M from 'fp-ts/lib/Map';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Eq';
import * as T from 'fp-ts/lib/Task';
import * as S from 'fp-ts/lib/string';
import { contramap, Ord } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/function';
import { ContextToken, createContextToken } from './context.token.factory';

export const ordContextToken: Ord<ContextToken<unknown>> = contramap((t: ContextToken<unknown>) => t._id)(S.Ord);
export const setoidContextToken: E.Eq<ContextToken> = { equals: ordContextToken.equals };

export interface Context extends Map<ContextToken, ContextDependency | any> {}

export interface ContextProvider { <T>(token: ContextToken<T>): O.Option<T> }

export interface ContextReader extends R.Reader<Context, any> {}

export enum ContextReaderTag {
  EAGER_READER,
  LAZY_READER,
}

export interface ContextEagerReader {
  tag: ContextReaderTag.EAGER_READER;
  eval: ContextReader;
}

export interface ContextLazyReader {
  tag: ContextReaderTag.LAZY_READER;
  eval: () => ContextReader;
}

export type ContextDependency = ContextEagerReader | ContextLazyReader;

export interface BoundDependency<T, U extends ContextDependency = ContextDependency> {
  token: ContextToken<T>;
  dependency: U;
}

export const DerivedContextToken = createContextToken<Context>('DerivedContext');

const isEagerDependency = (x: any): x is ContextEagerReader =>
  Boolean(x.eval && x.tag === ContextReaderTag.EAGER_READER);

const isLazyDependency = (x: any): x is ContextLazyReader =>
  Boolean(x.eval && x.tag === ContextReaderTag.LAZY_READER);

export const createContext = () => M.empty;

export const register = <T>(boundDependency: BoundDependency<T, ContextDependency>) => (context: Context): Context =>
  M.insertAt(setoidContextToken)(
    boundDependency.token,
    boundDependency.dependency,
  )(context);

export const registerAll = (boundDependencies: BoundDependency<any, any>[]) => (context: Context): Context =>
  boundDependencies.reduce(
    (ctx, dependency) => register(dependency)(ctx),
    context,
  );

/**
 * Unregisters given token from the context
 * @since v3.4.0
 */
export const unregister = (token: ContextToken) => (context: Context): Context =>
  M.deleteAt(setoidContextToken)(token)(context);

/**
 * Resolves eager dependencies within the context
 * @since v2.0.0
 */
export const resolve = async (context: Context): Promise<Context> => {
  const resolveEagerDependency = ({ token, dependency }: BoundDependency<unknown, ContextEagerReader>): T.Task<Context> => pipe(
    () => pipe(context, dependency.eval, d => Promise.resolve(d)),
    T.chain(resolvedDependency => T.fromIO(() => context.set(token, resolvedDependency))));

  for (const [token, dependency] of context) {
    if (!isEagerDependency(dependency)) continue;
    await resolveEagerDependency({ token, dependency })();
  }

  return context;
};

/**
 * Lookup the dependency for a token in a `Context`
 * @since v2.0.0
 */
export const lookup = (context: Context) => <T>(token: ContextToken<T>): O.Option<T> =>
  pipe(
    M.lookup(ordContextToken)(token, context),
    O.map(dependency => {
      if (!dependency.eval) return dependency;

      const boostrapedDependency = isLazyDependency(dependency)
        ? dependency.eval()(context)
        : dependency.eval(context);

      context.set(token, boostrapedDependency);

      return boostrapedDependency;
    }),
    O.fold(
      () => pipe(
        M.lookup(ordContextToken)(DerivedContextToken, context),
        O.chain((derivedContext: Context) => lookup(derivedContext)(token))),
      O.some),
  );

/**
 * Binds context token to a lazy dependency.
 * @since v3.0.0
 */
export const bindLazilyTo =
  <T>(token: ContextToken<T>) =>
  <U extends ContextReader>(dependency: U): BoundDependency<T, ContextLazyReader> =>
    ({ token, dependency: { eval: () => dependency, tag: ContextReaderTag.LAZY_READER } });

/**
 * Binds context token to a eager dependency.
 * @since v3.0.0
 */
export const bindEagerlyTo =
  <T>(token: ContextToken<T>) =>
  <U extends ContextReader>(dependency: U): BoundDependency<T, ContextEagerReader> =>
    ({ token, dependency: { eval: dependency, tag: ContextReaderTag.EAGER_READER } });

/**
 * An alias to `bindLazilyTo`.
 * Binds context token to a lazy dependency.
 * @since v3.0.0
 */
export const bindTo = bindLazilyTo;

export const reader = pipe(
  R.ask<Context>(),
  R.map(lookup),
);
