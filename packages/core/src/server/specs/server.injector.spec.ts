import * as http from 'http';
import { bind, createInjectionToken, createStaticInjectionContainer } from '../server.injector';

describe('#bind', () => {
  const httpServer = {} as http.Server;

  test('factorizes dependency', () => {
    // given
    const dependency = { test: 'test_string' };
    const Token = createInjectionToken<typeof dependency>();

    // when
    const factorizedDependency = bind(Token).to(() => dependency);

    // then
    expect(factorizedDependency.token).toBe(Token);
    expect(factorizedDependency.factory(httpServer)).toEqual(dependency);
  });
});

describe('#createStaticInjectionContainer', () => {
  const httpServer = {} as http.Server;

  test('#register registers single dependency', () => {
    // given
    const dependency = { test: 'test_string' };
    const Token = createInjectionToken<typeof dependency>();
    const container = createStaticInjectionContainer();

    // when
    container.register(Token, () => dependency)(httpServer);

    // then
    expect(container.get(Token)).toEqual(dependency);
  });

  test('#register registers multiple dependencies', () => {
    // given
    const dependency1 = { test1: 1 };
    const dependency2 = { test2: 2 };
    const dependency3 = { test3: 3 };
    const Token1 = createInjectionToken<typeof dependency1>();
    const Token2 = createInjectionToken<typeof dependency2>();
    const Token3 = createInjectionToken<typeof dependency3>();
    const container = createStaticInjectionContainer();

    // when
    container.registerAll([
      { token: Token1, factory: () => dependency1 },
      { token: Token2, factory: () => dependency2 },
      { token: Token3, factory: () => dependency3 },
    ])(httpServer);

    // then
    expect(container.get(Token1)).toEqual(dependency1);
    expect(container.get(Token2)).toEqual(dependency2);
    expect(container.get(Token3)).toEqual(dependency3);
  });

  test('#deregister clears registered dependency', () => {
    // given
    const dependency1 = { test1: 1 };
    const dependency2 = { test2: 2 };
    const Token1 = createInjectionToken<typeof dependency1>();
    const Token2 = createInjectionToken<typeof dependency2>();
    const container = createStaticInjectionContainer();

    // when
    container.register(Token1, () => dependency1)(httpServer);
    container.register(Token2, () => dependency2)(httpServer);
    container.deregister(Token1);

    // then
    expect(container.get(Token1)).toBeUndefined();
    expect(container.get(Token2)).toEqual(dependency2);
  });

  test('#deregisterAll clears registered dependencies', () => {
    // given
    const dependency = { test: 'test_string' };
    const Token = createInjectionToken<typeof dependency>();
    const container = createStaticInjectionContainer();

    // when
    container.register(Token, () => dependency)(httpServer);
    container.deregisterAll();

    // then
    expect(container.get(Token)).toBeUndefined();
  });
});
