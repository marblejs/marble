import * as http from 'http';

export type Injectable = (httpServer: http.Server) => any;
export type Injector = typeof createStaticInjectionContainer;
export type InjectionDependencies = { token: InjectionToken, factory: Injectable }[];
export type InjectionToken<T = any> = new() => Token<T>;

export interface InjectionGetter {
  <T>(key: InjectionToken<T>): T;
}

export class Token<T = any> {
  surrogate!: T;
}

export const createInjectionToken = <T>() =>
  class InlineToken extends Token<T> {};

export const createStaticInjectionContainer = () => {
  const dependencies = new Map<InjectionToken, any>();

  const register = <T>(token: InjectionToken<T>, factory: Injectable) => (httpServer: http.Server) =>
    dependencies.set(token, factory(httpServer));

  const deregister = <T>(token: InjectionToken<T>) =>
    dependencies.delete(token);

  const get = <T>(token: InjectionToken<T>): T =>
    dependencies.get(token);

  const registerAll = (dependenciesToRegister: InjectionDependencies) => (httpServer: http.Server) =>
    dependenciesToRegister.forEach(({ token, factory }) =>
      register(token, factory)(httpServer)
    );

  const deregisterAll = () =>
    dependencies.clear();

  return {
    get,
    register,
    registerAll,
    deregister,
    deregisterAll,
  };
};

export const bind = <T>(token: InjectionToken<T>) => ({
  to: (factory: Injectable) => ({ token, factory })
});
