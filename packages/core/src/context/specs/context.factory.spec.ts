import { isEmpty, size } from 'fp-ts/lib/Map';
import { some } from 'fp-ts/lib/Option';
import { ask } from 'fp-ts/lib/Reader';
import { createContext, bindTo, register, registerAll, Context, reader, lookup } from '../context.factory';
import { createContextToken } from '../context.token.factory';

describe('#bindTo', () => {
  test('binds reader to token', () => {
    // given
    const context = createContext();
    const reader = ask<Context>().map(_ => 'test');
    const Token = createContextToken<typeof reader>();

    // when
    const boundFactory = bindTo(Token)(reader);

    // then
    expect(boundFactory.token).toBe(Token);
    expect(boundFactory.reader.run(context)).toEqual('test');
  });
});

describe('#createContext', () => {
  test('creates empty context', () => {
    const context = createContext();
    expect(isEmpty(context)).toBe(true);
  });
});

describe('#register', () => {
  test('registers bound readers', () => {
    // given
    const token = createContextToken();
    const dependency = ask<Context>().map(_ => 'test');
    const boundReader = bindTo(token)(dependency);

    // when
    const context = register(boundReader)(createContext());

    // then
    expect(lookup(context)(token)).toEqual(some('test'));
  });
});

describe('#registerAll', () => {
  test('registers set of bound readers', () => {
    // given
    const token1 = createContextToken<string>();
    const token2 = createContextToken<string>();
    const token3 = createContextToken<string>();
    const dependency1 = ask<Context>().map(_ => 'test_1');
    const dependency2 = ask<Context>().map(_ => 'test_2');
    const dependency3 = ask<Context>().map(_ => 'test_3');

    // when
    const context = registerAll([
      bindTo(token1)(dependency1),
      bindTo(token2)(dependency2),
      bindTo(token3)(dependency3),
    ])(createContext());

    // then
    expect(size(context)).toEqual(3);
    expect(lookup(context)(token2)).toEqual(some('test_2'));
  });
});

describe('#reader', () => {
  test('asks context for dependency', () => {
    // given
    const token1 = createContextToken<string>();
    const token2 = createContextToken<string>();
    const dependency1 = reader.map(() => 'test_1');
    const dependency2 = reader
      .map(ask => ask(token1)
        .map(v => v + '_2')
        .getOrElse(''));

    // when ordered
    const context1 = registerAll([
      bindTo(token1)(dependency1),
      bindTo(token2)(dependency2),
    ])(createContext());

    // when reordered
    const context2 = registerAll([
      bindTo(token2)(dependency2),
      bindTo(token1)(dependency1),
    ])(createContext());

    // then
    expect(lookup(context1)(token2)).toEqual(some('test_1_2'));
    expect(lookup(context2)(token2)).toEqual(some('test_1_2'));
  });
});
