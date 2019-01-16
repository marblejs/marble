import * as http from 'http';

export type Injectable = (httpServer: http.Server) => any;
export type InjectionDependencies = { token: InjectionToken, factory: Injectable }[];
export type InjectionToken<T = any> = new() => Token<T>;

export interface InjectorGetter {
  <T>(token: InjectionToken<T>): T;
}

export class Token<T = any> {
  surrogate!: T;
}

export class StaticInjector {
  private dependencies = new Map<InjectionToken, any>();

  register = <T>(token: InjectionToken<T>, factory: Injectable) => (httpServer: http.Server) =>
    this.dependencies.set(token, factory(httpServer))

  deregister = <T>(token: InjectionToken<T>) =>
    this.dependencies.delete(token)

  get = <T>(token: InjectionToken<T>): T =>
    this.dependencies.get(token)

  registerAll = (dependenciesToRegister: InjectionDependencies) => (httpServer: http.Server) =>
    dependenciesToRegister.forEach(({ token, factory }) =>
      this.register(token, factory)(httpServer)
    )

  deregisterAll = () =>
    this.dependencies.clear()
}

export const createInjectionToken = <T>() =>
  class InlineToken extends Token<T> {};

export const createStaticInjectionContainer = () =>
  new StaticInjector();

export const bind = <T>(token: InjectionToken<T>) => ({
  to: (factory: Injectable) => ({ token, factory })
});
