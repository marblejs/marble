import { createContext } from '../context.factory';
import { createContextToken } from '../context.token.factory';
import { bindTo } from '../context.binder';

describe('#bindTo', () => {
  const context = createContext();

  test('binds factory to token', () => {
    // given
    const dependency = { test: 'test_string' };
    const Token = createContextToken<typeof dependency>();

    // when
    const boundFactory = bindTo(() => dependency)(Token);

    // then
    expect(boundFactory.token).toBe(Token);
    expect(boundFactory.factory(context)).toEqual(dependency);
  });
});

describe('#createContextToken', () => {
  test('#register registers single dependency', () => {
    // given
    const dependency = { test: 'test_string' };
    const Token = createContextToken<typeof dependency>();
    const context = createContext();

    // when
    context.register(Token, () => dependency);

    // then
    expect(context.ask(Token)).toEqual(dependency);
  });

  test('#register registers multiple dependencies', () => {
    // given
    const dependency1 = { test1: 1 };
    const dependency2 = { test2: 2 };
    const dependency3 = { test3: 3 };
    const Token1 = createContextToken<typeof dependency1>();
    const Token2 = createContextToken<typeof dependency2>();
    const Token3 = createContextToken<typeof dependency3>();
    const context = createContext();

    // when
    context.registerAll([
      { token: Token1, factory: () => dependency1 },
      { token: Token2, factory: () => dependency2 },
      { token: Token3, factory: () => dependency3 },
    ]);

    // then
    expect(context.ask(Token1)).toEqual(dependency1);
    expect(context.ask(Token2)).toEqual(dependency2);
    expect(context.ask(Token3)).toEqual(dependency3);
  });

  test('#deregister clears registered dependency', () => {
    // given
    const dependency1 = { test1: 1 };
    const dependency2 = { test2: 2 };
    const Token1 = createContextToken<typeof dependency1>();
    const Token2 = createContextToken<typeof dependency2>();
    const context = createContext();

    // when
    context.register(Token1, () => dependency1);
    context.register(Token2, () => dependency2);
    context.deregister(Token1);

    // then
    expect(context.ask(Token1)).toBeUndefined();
    expect(context.ask(Token2)).toEqual(dependency2);
  });

  test('#deregisterAll clears registered dependencies', () => {
    // given
    const dependency = { test: 'test_string' };
    const Token = createContextToken<typeof dependency>();
    const context = createContext();

    // when
    context.register(Token, () => dependency);
    context.deregisterAll();

    // then
    expect(context.ask(Token)).toBeUndefined();
  });
});
