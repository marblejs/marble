export type Injectable = (context: Injector) => any;
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

  register = <T>(token: InjectionToken<T>, factory: Injectable) => {
    this.dependencies.set(token, factory(this));
    return this;
  }

  deregister = <T>(token: InjectionToken<T>) => {
    this.dependencies.delete(token);
    return this;
  }

  get = <T>(token: InjectionToken<T>): T => {
    return this.dependencies.get(token);
  }

  registerAll = (dependenciesToRegister: InjectionDependencies) => {
    dependenciesToRegister.forEach(({ token, factory }) =>
      this.register(token, factory)
    );
    return this;
  }

  deregisterAll = () => {
    this.dependencies.clear();
    return this;
  }
}

export const createInjectionToken = <T>() =>
  class InlineToken extends Token<T> {};

export const createStaticInjectionContainer = () =>
  new StaticInjector();

export type Injector = StaticInjector;

export const bind = <T>(token: InjectionToken<T>) => ({
  to: (factory: Injectable) => ({ token, factory })
});
