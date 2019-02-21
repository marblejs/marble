import * as R from 'fp-ts/lib/Reader';
import * as M from 'fp-ts/lib/Map';
import { Setoid } from 'fp-ts/lib/Setoid';
import { Option } from 'fp-ts/lib/Option';
import { contramap, ordString, Ord } from 'fp-ts/lib/Ord';
import { ContextToken } from './context.token.factory';

const ordContextToken: Ord<ContextToken<any>> = contramap((t: ContextToken) => t._id, ordString);
const setoidContextToken: Setoid<ContextToken> = { equals: ordContextToken.equals };

export interface Context extends Map<ContextToken, any> {}
export interface ContextReader { <T>(token: ContextToken<T>): Option<T>; }
export interface Injectable extends R.Reader<Context, any> {}
export interface BoundInjectable<T> { token: ContextToken<T>; factory: Injectable; }

export const createContext = () => M.empty;

export const register = <T>(i: BoundInjectable<T>) => (context: Context) =>
  M.insert(setoidContextToken)(i.token, i.factory.run(context), context);

export const registerAll = (boundInjectables: BoundInjectable<any>[]) => (context: Context) =>
  boundInjectables.reduce(
    (ctx, i) => register(i)(ctx),
    context,
  );

export const lookupToken = <T>(token: ContextToken<T>) => (context: Context): Option<T> =>
  M.lookup(ordContextToken)(token, context);

export const lookup = (context: Context) => <T>(token: ContextToken<T>): Option<T> =>
  lookupToken(token)(context);

export const bindTo = <T>(token: ContextToken<T>) => (factory: Injectable): BoundInjectable<T> =>
  ({ token, factory });

export const askContext = R.ask<Context>().map(lookup);
