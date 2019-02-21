import { ContextToken } from './context.token.factory';

export type Injectable = (context: Context) => any;
export type ContextDependencies = { token: ContextToken, factory: Injectable }[];

export interface ContextReader {
  <T>(token: ContextToken<T>): T;
}

export class Context {
  private dependencies = new Map<ContextToken, any>();

  register = <T>(token: ContextToken<T>, factory: Injectable) => {
    this.dependencies.set(token, factory(this));
    return this;
  }

  deregister = <T>(token: ContextToken<T>) => {
    this.dependencies.delete(token);
    return this;
  }

  ask = <T>(token: ContextToken<T>): T => {
    return this.dependencies.get(token);
  }

  registerAll = (dependencies: ContextDependencies) => {
    dependencies.forEach(({ token, factory }) =>
      this.register(token, factory)
    );
    return this;
  }

  deregisterAll = () => {
    this.dependencies.clear();
    return this;
  }
}

export const createContext = () => new Context();
