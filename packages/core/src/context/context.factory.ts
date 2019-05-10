import * as R from 'fp-ts/lib/Reader';
import * as M from 'fp-ts/lib/Map';
import { Setoid } from 'fp-ts/lib/Setoid';
import { Option } from 'fp-ts/lib/Option';
import { contramap, ordString, Ord } from 'fp-ts/lib/Ord';
import { ContextToken } from './context.token.factory';

const ordContextToken: Ord<ContextToken<any>> = contramap((t: ContextToken) => t._id, ordString);
const setoidContextToken: Setoid<ContextToken> = { equals: ordContextToken.equals };

export interface Context extends Map<ContextToken, R.Reader<any, any> | any> {}

export interface ContextProvider { <T>(token: ContextToken<T>): Option<T> }

export interface ContextReader extends R.Reader<Context, any> {}

export interface ContextEagerReader { (ctx: Context): any }

export type ContextDependency = ContextReader | ContextEagerReader;

export interface BoundDependency<T, U extends ContextDependency = ContextDependency> {
  token: ContextToken<T>;
  dependency: U;
}

const isReader = (x: any): x is R.Reader<any, any> => !!x.run;

export const createContext = () => M.empty;

export const register = <T>(boundDependency: BoundDependency<T, any>) => (context: Context) =>
  M.insert(setoidContextToken)(
    boundDependency.token,
    isReader(boundDependency.dependency)
      ? boundDependency.dependency
      : boundDependency.dependency(context),
    context
  );

export const registerAll = (boundDependencies: BoundDependency<any, any>[]) => (context: Context) =>
  boundDependencies.reduce(
    (ctx, dependency) => register(dependency)(ctx),
    context,
  );

export const lookup = (context: Context) => <T>(token: ContextToken<T>): Option<T> =>
  M.lookup(ordContextToken)(token, context).map(dependency =>
    isReader(dependency)
      ? dependency.run(context)
      : dependency
  );

export const bindTo =
  <T>(token: ContextToken<T>) =>
  <U extends ContextDependency>(dependency: U): BoundDependency<T, U> =>
    ({ token, dependency });

export const reader = R.ask<Context>().map(lookup);
