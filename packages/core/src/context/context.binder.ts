import { Injectable } from './context.factory';
import { ContextToken } from './context.token.factory';

interface BoundFactory<T> {
  token: ContextToken<T>;
  factory: Injectable;
}

export const bindTo = (factory: Injectable) => <T>(token: ContextToken<T>): BoundFactory<T> =>
  ({ token, factory });
