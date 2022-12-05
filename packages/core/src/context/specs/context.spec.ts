import { isEmpty, size } from 'fp-ts/lib/Map';
import { flow, pipe } from 'fp-ts/lib/function';
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
  resolve,
  DerivedContextToken,
  unregister,
} from '../context';
import { createContextToken } from '../context.token.factory';
import { contextFactory } from '../context.helper';
import { wait } from '../../+internal/utils';
import { createReader } from '../context.reader.factory';
import { useContext } from '../context.hook';

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
  test('registers bound reader', () => {
    // given
    const token = createContextToken();
    const dependency = pipe(R.ask<Context>(), R.map(_ => 'test'));
    const boundDependency = bindTo(token)(dependency);

    // when
    const context = register(boundDependency)(createContext());

    // then
    expect(lookup(context)(token)).toEqual(O.some('test'));
  });
});

describe('#registerAll', () => {
  test('registers set of bound readers', () => {
    // given
    const token1 = createContextToken<string>();
    const token2 = createContextToken<string>();
    const token3 = createContextToken<string>();
    const dependency1 = pipe(R.ask<Context>(), R.map(_ => 'test_1'));
    const dependency2 = pipe(R.ask<Context>(), R.map(_ => 'test_2'));
    const dependency3 = pipe(R.ask<Context>(), R.map(_ => 'test_3'));

    // when
    const context = registerAll([
      bindTo(token1)(dependency1),
      bindTo(token2)(dependency2),
      bindTo(token3)(dependency3),
    ])(createContext());

    // then
    expect(size(context)).toEqual(3);
    expect(lookup(context)(token2)).toEqual(O.some('test_2'));
  });
});

describe('#unregister', () => {
  test('unregisters specified token', () => {
    // given
    const token = createContextToken<string>();
    const token_to_delete = createContextToken<string>();
    const dependency = pipe(R.ask<Context>(), R.map(_ => 'test'));
    const dependency_to_delete = pipe(R.ask<Context>(), R.map(_ => 'test_to_delete'));

    const contextBefore = registerAll([
      bindTo(token)(dependency),
      bindTo(token_to_delete)(dependency_to_delete),
    ])(createContext());

    // when
    const contextAfter = unregister(token_to_delete)(contextBefore);

    // then
    expect(size(contextAfter)).toEqual(1);
    expect(lookup(contextAfter)(token_to_delete)).toEqual(O.none);
  });
});

describe('#resolve', () => {
  test('resolves asynchronous eager reader', async () => {
    // given
    const token1 = createContextToken();
    const token2 = createContextToken();

    // reader dependency
    const dependency1 = pipe(R.ask<Context>(), R.map(async _ => 'test_1'));

    // factory function
    const dependency2 = async () => 'test_2';

    // when
    const context = registerAll([
      bindEagerlyTo(token1)(dependency1),
      bindEagerlyTo(token2)(dependency2),
    ])(createContext());
    const resolvedContext = await resolve(context);

    // then
    expect(lookup(resolvedContext)(token1)).toEqual(O.some('test_1'));
    expect(lookup(resolvedContext)(token2)).toEqual(O.some('test_2'));
  });

  test('resolves synchronous eager reader', async () => {
    // given
    const token = createContextToken();
    const dependency = pipe(R.ask<Context>(), R.map(_ => 'test'));
    const boundDependency = bindEagerlyTo(token)(dependency);

    // when
    const context = register(boundDependency)(createContext());
    const resolvedContext = await resolve(context);

    // then
    expect(lookup(resolvedContext)(token)).toEqual(O.some('test'));
  });

  test('rejects when dependency throws an error', async () => {
    // given
    const error = new Error('unknown error');
    const token = createContextToken();
    const dependency = pipe(R.ask<Context>(), R.map(_ => { throw error; }));
    const boundDependency = bindEagerlyTo(token)(dependency);

    // when
    const context = register(boundDependency)(createContext());
    const resolvedContext = () => resolve(context);

    // then
    expect(resolvedContext()).rejects.toEqual(error);
  });

  test('rejects when ASYNC dependency rejects with an error', async () => {
    // given
    const error = 'unknown error';
    const token = createContextToken();
    const dependency = pipe(R.ask<Context>(), R.map(async _ => Promise.reject(error)));
    const boundDependency = bindEagerlyTo(token)(dependency);

    // when
    const context = register(boundDependency)(createContext());
    const resolvedContext = () => resolve(context);

    // then
    expect(resolvedContext()).rejects.toEqual(error);
  });

  test('rejects when inner injected ASYNC dependency rejects with an error', async () => {

    // given - dependencies
    const dependency_1_token = createContextToken();
    const dependency_1 = createReader(async () => {
      throw new Error('unknown error');
    });

    const dependency_2_token = createContextToken();
    const dependency_2 = createReader(ask => {
      return useContext(dependency_1_token)(ask);
    });

    // when
    const context = registerAll([
      bindEagerlyTo(dependency_1_token)(dependency_1),
      bindLazilyTo(dependency_2_token)(dependency_2),
    ])(createContext());
    const resolvedContext = () => resolve(context);

    // then
    expect(resolvedContext()).rejects.toEqual(new Error('unknown error'));
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
    const context1 = await flow(
      registerAll([
        bindTo(token1)(dependency1),
        bindTo(token2)(dependency2),
      ]),
      resolve,
    )(createContext());

    // when reordered
    const context2 = await flow(
      registerAll([
        bindTo(token2)(dependency2),
        bindTo(token1)(dependency1),
      ]),
      resolve,
    )(createContext());

    // then
    expect(lookup(context1)(token2)).toEqual(O.some('test_1_2'));
    expect(lookup(context2)(token2)).toEqual(O.some('test_1_2'));
  });

  test('asks context for a eager reader dependency (the binding order doesn\'t matter)', async () => {
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
    const context = await flow(
      registerAll([
        bindEagerlyTo(token2)(dependency2),
        bindLazilyTo(token1)(dependency1),
        bindLazilyTo(token3)(dependency3),
      ]),
      resolve,
    )(createContext());

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
    const context = await flow(
      registerAll([
        bindTo(token)(dependency),
      ]),
      resolve,
    )(createContext());

    // then
    expect(lookup(context)(token)).toEqual(O.some('test'));
    expect(lookup(context)(token)).toEqual(O.some('test'));
    expect(lookup(context)(token)).toEqual(O.some('test'));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('asks context for a derived context dependency', async () => {
    // given
    const unknownToken = createContextToken<unknown>();

    // given - derived context
    const derivedDependency_1 = () => 'test_1';
    const derivedDependency_2 = () => 'test_2';
    const derivedDependencyToken_1 = createContextToken();
    const derivedDependencyToken_2 = createContextToken();

    const derivedContext = await contextFactory(
      bindTo(derivedDependencyToken_1)(derivedDependency_1),
      bindTo(derivedDependencyToken_2)(derivedDependency_2),
    );

    // given - new context
    const dependency_3 = () => 'test_3';
    const dependencyToken_3 = createContextToken();

    const context = await contextFactory(
      bindEagerlyTo(DerivedContextToken)(() => derivedContext),
      bindTo(dependencyToken_3)(dependency_3),
    );

    // when, then
    expect(lookup(context)(derivedDependencyToken_1)).toEqual(O.some('test_1'));
    expect(lookup(context)(derivedDependencyToken_2)).toEqual(O.some('test_2'));
    expect(lookup(context)(dependencyToken_3)).toEqual(O.some('test_3'));
    expect(lookup(context)(unknownToken)).toEqual(O.none);
  });

  test('asks context for dependant asynchronous dependencies', async () => {
    // given
    const executionOrder: number[] = [];
    const spy1 = jest.fn(() => executionOrder.push(1));
    const spy2 = jest.fn(() => executionOrder.push(2));
    const spy3 = jest.fn(() => executionOrder.push(3));
    const token1 = createContextToken<string>();
    const token2 = createContextToken<string>();
    const token3 = createContextToken<string>();

    const dependency1 = pipe(reader, R.map(async () => {
      spy1();
      wait(0.5);
      return 'test';
    }));

    const dependency2 = pipe(reader, R.map(ask => {
      spy2();
      return pipe(ask(token1), O.map(async v => {
        await wait(0.5);
        return v + '_1';
      }), O.getOrElse(() => Promise.resolve('')));
    }));

    const dependency3 = pipe(reader, R.map(ask => {
      spy3();
      return pipe(ask(token2), O.map(async v => {
        await wait(0.5);
        return v + '_2';
      }), O.getOrElse(() => Promise.resolve('')));
    }));

    // when
    const context = await flow(
      registerAll([
        bindEagerlyTo(token1)(dependency1),
        bindEagerlyTo(token2)(dependency2),
        bindEagerlyTo(token3)(dependency3),
      ]),
      resolve,
    )(createContext());

    // then
    expect(lookup(context)(token1)).toEqual(O.some('test'));
    expect(lookup(context)(token2)).toEqual(O.some('test_1'));
    expect(lookup(context)(token3)).toEqual(O.some('test_1_2'));
    expect(executionOrder).toEqual([1, 2, 3]);
  });
});
