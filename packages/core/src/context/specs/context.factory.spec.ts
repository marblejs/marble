import { isEmpty, size } from 'fp-ts/lib/Map';
import { pipe } from 'fp-ts/lib/pipeable';
import * as R from 'fp-ts/lib/Reader';
import * as O from 'fp-ts/lib/Option';
import {
  createContext,
  bindTo,
  bindLazilyTo,
  bindEagerlyTo,
  register,
  registerAll,
  reader,
  lookup,
  Context,
  ContextReader,
  ContextReaderTag,
} from '../context.factory';
import { createContextToken } from '../context.token.factory';

describe('#bindTo', () => {
  test('binds lazy reader to token', () => {
    // given
    const context = createContext();
    const reader = pipe(R.ask<Context>(), R.map(_ => 'test'));
    const Token = createContextToken<typeof reader>();

    // when
    const boundDependency = bindTo(Token)(reader);

    // then
    expect(boundDependency.token).toBe(Token);
    expect(boundDependency.dependency.tag).toEqual(ContextReaderTag.LAZY_READER);
    expect(boundDependency.dependency.eval()(context)).toEqual('test');
  });

  test('binds value to token', () => {
    // given
    const valueReader: ContextReader = _ => 'test';
    const Token = createContextToken<typeof reader>();

    // when
    const boundDependency = bindTo(Token)(valueReader);

    // then
    expect(boundDependency.token).toBe(Token);
    expect(boundDependency.dependency.tag).toEqual(ContextReaderTag.LAZY_READER);
    expect(boundDependency.dependency.eval()).toEqual(valueReader);
  });
});

describe('#createContext', () => {
  test('creates empty context', () => {
    const context = createContext();
    expect(isEmpty(context)).toBe(true);
  });
});

describe('#register', () => {
  test('registers bound sync reader', async () => {
    // given
    const token = createContextToken();
    const dependency = pipe(R.ask<Context>(), R.map(_ => 'test'));
    const boundDependency = bindTo(token)(dependency);

    // when
    const context = await register(boundDependency)(createContext());

    // then
    expect(lookup(context)(token)).toEqual(O.some('test'));
  });

  test('registers bound async readers', async () => {
    // given
    const token = createContextToken();
    const dependency = pipe(R.ask<Context>(), R.map(_ => Promise.resolve('test')));
    const boundDependency = bindEagerlyTo(token)(dependency);

    // when
    const context = await register(boundDependency)(createContext());

    // then
    expect(lookup(context)(token)).toEqual(O.some('test'));
  });
});

describe('#registerAll', () => {
  test('registers set of bound readers', async () => {
    // given
    const token1 = createContextToken<string>();
    const token2 = createContextToken<string>();
    const token3 = createContextToken<string>();
    const dependency1 = pipe(R.ask<Context>(), R.map(_ => 'test_1'));
    const dependency2 = pipe(R.ask<Context>(), R.map(_ => 'test_2'));
    const dependency3 = pipe(R.ask<Context>(), R.map(_ => 'test_3'));

    // when
    const context = await registerAll([
      bindTo(token1)(dependency1),
      bindTo(token2)(dependency2),
      bindTo(token3)(dependency3),
    ])(createContext());

    // then
    expect(size(context)).toEqual(3);
    expect(lookup(context)(token2)).toEqual(O.some('test_2'));
  });
});

describe('#reader', () => {
  test('asks context for a lazy reader dependency', async () => {
    // given
    const token1 = createContextToken<string>();
    const token2 = createContextToken<string>();
    const dependency1 = pipe(reader, R.map(() => 'test_1'));
    const dependency2 = pipe(reader, R.map(ask => pipe(
      ask(token1),
      O.map(v => v + '_2'),
      O.getOrElse(() => '')),
    ));

    // when ordered
    const context1 = await registerAll([
      bindTo(token1)(dependency1),
      bindTo(token2)(dependency2),
    ])(createContext());

    // when reordered
    const context2 = await registerAll([
      bindTo(token2)(dependency2),
      bindTo(token1)(dependency1),
    ])(createContext());

    // then
    expect(lookup(context1)(token2)).toEqual(O.some('test_1_2'));
    expect(lookup(context2)(token2)).toEqual(O.some('test_1_2'));
  });

  test('asks context for a eager reader dependency', async () => {
    // given
    const executionOrder: number[] = [];
    const spy1 = jest.fn(() => executionOrder.push(1));
    const spy2 = jest.fn(() => executionOrder.push(2));
    const spy3 = jest.fn(() => executionOrder.push(3));
    const token1 = createContextToken<string>();
    const token2 = createContextToken<string>();
    const token3 = createContextToken<string>();

    const dependency1 = pipe(reader, R.map(() => {
      spy1();
      return 'test';
    }));

    const dependency2 = pipe(reader, R.map(ask => {
      spy2();
      return pipe(ask(token1), O.map(v => v + '_1'), O.getOrElse(() => ''));
    }));

    const dependency3 = pipe(reader, R.map(ask => {
      spy3();
      return pipe(ask(token2), O.map(v => v + '_2'), O.getOrElse(() => ''));
    }));

    // when
    const context = await registerAll([
      bindLazilyTo(token1)(dependency1),
      bindEagerlyTo(token2)(dependency2),
      bindLazilyTo(token3)(dependency3),
    ])(createContext());

    // then
    expect(lookup(context)(token1)).toEqual(O.some('test'));
    expect(lookup(context)(token2)).toEqual(O.some('test_1'));
    expect(lookup(context)(token3)).toEqual(O.some('test_1_2'));
    expect(executionOrder).toEqual([2, 1, 3]);
  });

  test('asks context for a lazy reader dependency and bootstraps it only once', async () => {
    // given
    const spy = jest.fn();
    const token = createContextToken<string>();
    const dependency = pipe(reader, R.map(() => { spy(); return 'test'; }));

    // when
    const context = await registerAll([
      bindTo(token)(dependency),
    ])(createContext());

    // then
    expect(lookup(context)(token)).toEqual(O.some('test'));
    expect(lookup(context)(token)).toEqual(O.some('test'));
    expect(lookup(context)(token)).toEqual(O.some('test'));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
