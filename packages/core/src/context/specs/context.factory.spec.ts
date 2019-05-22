import { isEmpty, size } from 'fp-ts/lib/Map';
import { some } from 'fp-ts/lib/Option';
import { ask } from 'fp-ts/lib/Reader';
import {
  Context,
  ContextEagerReader,
  createContext,
  bindTo,
  register,
  registerAll,
  reader,
  lookup,
} from '../context.factory';
import { createContextToken } from '../context.token.factory';

describe('#bindTo', () => {
  test('binds reader to token', () => {
    // given
    const context = createContext();
    const reader = ask<Context>().map(_ => 'test');
    const Token = createContextToken<typeof reader>();

    // when
    const boundDependency = bindTo(Token)(reader);

    // then
    expect(boundDependency.token).toBe(Token);
    expect((boundDependency.dependency).run(context)).toEqual('test');
  });

  test('binds singleton to token', () => {
    // given
    const singleton: ContextEagerReader = _ => 'test';
    const Token = createContextToken<typeof reader>();

    // when
    const boundDependency = bindTo(Token)(singleton);

    // then
    expect(boundDependency.token).toBe(Token);
    expect(boundDependency.dependency).toEqual(singleton);
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
    const boundDependency = bindTo(token)(dependency);

    // when
    const context = register(boundDependency)(createContext());

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
  test('asks context for a reader dependency', () => {
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

  test('asks context for a eager reader dependency', () => {
    // given
    const token1 = createContextToken<string>();
    const token2 = createContextToken<string>();
    const token3 = createContextToken<string>();
    const dependency1 = reader.map(() => 'test');
    const dependency2 = reader.map(ask => ask(token1).map(v => v + '_1').getOrElse(''));
    const dependency3 = reader.map(ask => ask(token2).map(v => v + '_2').getOrElse(''));

    // when
    const context = registerAll([
      bindTo(token1)(dependency1),
      bindTo(token2)(ctx => dependency2.run(ctx)),
      bindTo(token3)(dependency3),
    ])(createContext());

    // then
    expect(lookup(context)(token1)).toEqual(some('test'));
    expect(lookup(context)(token2)).toEqual(some('test_1'));
    expect(lookup(context)(token3)).toEqual(some('test_1_2'));
  });

  test('asks context for lazy reader dependency and bootstraps it only once', () => {
    // given
    const spy = jest.fn();
    const token = createContextToken<string>();
    const dependency = reader.map(() => { spy(); return 'test'; });

    // when
    const context = registerAll([
      bindTo(token)(dependency),
    ])(createContext());

    // then
    expect(lookup(context)(token)).toEqual(some('test'));
    expect(lookup(context)(token)).toEqual(some('test'));
    expect(lookup(context)(token)).toEqual(some('test'));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
