import * as http from 'http';

export type Injectable = (httpServer: http.Server) => any;
export type Injector = typeof createStaticInjectorContainer;
export type InjectorKey = string | symbol;
export type InjectorDependencies = Record<InjectorKey, Injectable>;

export interface InjectorGetter {
  <T>(key: InjectorKey): T | undefined;
}

export const createStaticInjectorContainer = () => {
  const dependencies = new Map<InjectorKey, any>();

  const register = (key: InjectorKey, depencency: any) =>
    dependencies.set(key, depencency);

  const deregister = (key: InjectorKey) =>
    dependencies.delete(key);

  const get = <T>(key: InjectorKey): T | undefined =>
    dependencies.get(key);

  const registerAll = (dependenciesToRegister: InjectorDependencies) => (httpServer: http.Server) => Object
    .entries(dependenciesToRegister)
    .forEach(([key, dependencyFactory]) => register(key, dependencyFactory(httpServer)));

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
