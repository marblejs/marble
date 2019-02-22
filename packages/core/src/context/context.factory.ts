import * as R from 'fp-ts/lib/Reader';
import * as M from 'fp-ts/lib/Map';
import { Setoid } from 'fp-ts/lib/Setoid';
import { Option } from 'fp-ts/lib/Option';
import { contramap, ordString, Ord } from 'fp-ts/lib/Ord';
import { ContextToken } from './context.token.factory';

const ordContextToken: Ord<ContextToken<any>> = contramap((t: ContextToken) => t._id, ordString);
const setoidContextToken: Setoid<ContextToken> = { equals: ordContextToken.equals };

export interface Context extends Map<ContextToken, R.Reader<any, any>> {}
export interface ContextProvider { <T>(token: ContextToken<T>): Option<T>; }
export interface ContextReader extends R.Reader<Context, any> {}
export interface BoundContextReader<T> { token: ContextToken<T>; reader: ContextReader; }

export const createContext = () => M.empty;

export const register = <T>(boundReader: BoundContextReader<T>) => (context: Context) =>
  M.insert(setoidContextToken)(boundReader.token, boundReader.reader, context);

export const registerAll = (boundReaders: BoundContextReader<any>[]) => (context: Context) =>
  boundReaders.reduce(
    (ctx, reader) => register(reader)(ctx),
    context,
  );

export const lookup = (context: Context) => <T>(token: ContextToken<T>): Option<T> =>
  M.lookup(ordContextToken)(token, context).map(d => d.run(context));

export const bindTo = <T>(token: ContextToken<T>) => (reader: ContextReader): BoundContextReader<T> =>
  ({ token, reader });

export const reader = R.ask<Context>().map(lookup);
