import { isEmpty, size } from 'fp-ts/lib/Map';
import { some } from 'fp-ts/lib/Option';
import { ask } from 'fp-ts/lib/Reader';
import { createContext, bindTo, register, lookupToken, registerAll, Context, askContext } from '../context.factory';
import { createContextToken } from '../context.token.factory';
import { compose } from 'fp-ts/lib/function';

describe('#bindTo', () => {
  test('binds factory to token', () => {
    // given
    const context = createContext();
    const dependency = ask<Context>().map(_ => 'test');
    const Token = createContextToken<typeof dependency>();

    // when
    const boundFactory = bindTo(Token)(dependency);

    // then
    expect(boundFactory.token).toBe(Token);
    expect(boundFactory.factory.run(context)).toEqual('test');
  });
});

describe('#createContext', () => {
  test('creates empty context', () => {
    const context = createContext();
    expect(isEmpty(context)).toBe(true);
  });
});

describe('#register', () => {
  test('registers bound injectable', () => {
    // given
    const context = createContext();
    const token = createContextToken();
    const dependency = ask<Context>().map(_ => 'test');
    const boundInjectable = bindTo(token)(dependency);

    // when
    const result = compose(
      lookupToken(token),
      register(boundInjectable),
    )(context);

    // then
    expect(result).toEqual(some('test'));
  });
});

describe('#registerAll', () => {
  test('registers set of bound injectables', () => {
    // given
    const context = createContext();
    const token1 = createContextToken<string>();
    const token2 = createContextToken<string>();
    const token3 = createContextToken<string>();
    const dependency1 = ask<Context>().map(_ => 'test_1');
    const dependency2 = ask<Context>().map(_ => 'test_2');
    const dependency3 = ask<Context>().map(_ => 'test_3');

    // when
    const newContext = registerAll([
      bindTo(token1)(dependency1),
      bindTo(token2)(dependency2),
      bindTo(token3)(dependency3),
    ])(context);
    const result = lookupToken(token2)(newContext);

    // then
    expect(size(newContext)).toEqual(3);
    expect(result).toEqual(some('test_2'));
  });
});

describe('#askContext', () => {
  test('asks context for dependency', () => {
    // given
    const context = createContext();
    const token1 = createContextToken<string>();
    const token2 = createContextToken<number>();
    const dependency1 = askContext.map(() => 'test_1');
    const dependency2 = askContext
      .map(ask => ask(token1)
        .map(v => v + '_2')
        .getOrElse(''));

    // when
    const result = compose(
      lookupToken(token2),
      registerAll([
        bindTo(token1)(dependency1),
        bindTo(token2)(dependency2),
      ]),
    )(context);

    // then
    expect(result).toEqual(some('test_1_2'));
  });
});
