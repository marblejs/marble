import * as R from 'fp-ts/lib/Reader';
import * as M from 'fp-ts/lib/Map';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Eq';
import { pipe } from 'fp-ts/lib/pipeable';
import { contramap, ordString, Ord } from 'fp-ts/lib/Ord';
import { ContextToken } from './context.token.factory';

const ordContextToken: Ord<ContextToken<any>> = contramap((t: ContextToken) => t._id)(ordString);
const setoidContextToken: E.Eq<ContextToken> = { equals: ordContextToken.equals };

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

const isEagerDependency = (x: any): x is ContextEagerReader => {
  return x.eval && x.tag === ContextReaderTag.EAGER_READER;
};

const isLazyDependency = (x: any): x is ContextLazyReader => {
  return x.eval && x.tag === ContextReaderTag.LAZY_READER;
};

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

export const resolve = async (context: Context): Promise<Context> => {
  for (const [token, dependency] of context) {
    context.set(
      token,
      isEagerDependency(dependency)
        ? await Promise.resolve(dependency.eval(context))
        : dependency,
    );
  }

  return context;
}

export const lookup = (context: Context) => <T>(token: ContextToken<T>): O.Option<T> => pipe(
  M.lookup(ordContextToken)(token, context),
  O.map(dependency => {
    if (!dependency.eval) {
      return dependency;
    }

    const boostrapedDependency = isLazyDependency(dependency)
      ? dependency.eval()(context)
      : dependency.eval(context);

    context.set(token, boostrapedDependency);
    return boostrapedDependency;
  }),
);

export const bindLazilyTo =
  <T>(token: ContextToken<T>) =>
  <U extends ContextReader>(dependency: U): BoundDependency<T, ContextLazyReader> =>
    ({ token, dependency: { eval: () => dependency, tag: ContextReaderTag.LAZY_READER } });

export const bindEagerlyTo =
  <T>(token: ContextToken<T>) =>
  <U extends ContextReader>(dependency: U): BoundDependency<T, ContextEagerReader> =>
    ({ token, dependency: { eval: dependency, tag: ContextReaderTag.EAGER_READER } });

export const bindTo = bindLazilyTo;

export const reader = pipe(
  R.ask<Context>(),
  R.map(lookup),
);
