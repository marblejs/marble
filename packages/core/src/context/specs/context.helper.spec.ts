import * as R from 'fp-ts/lib/Reader';
import * as O from 'fp-ts/lib/Option';
import { size } from 'fp-ts/lib/Map';
import { pipe } from 'fp-ts/lib/function';
import { createContextToken } from '../context.token.factory';
import { createReader } from '../context.reader.factory';
import { contextFactory, constructContext } from '../context.helper';
import { bindTo, lookup, DerivedContextToken, bindEagerlyTo, createContext, Context } from '../context';
import { LoggerToken } from '../../logger';

describe('#contextFactory', () => {
  test('builds context and allows to read default and custom dependencies', async () => {
    // given
    const token1 = createContextToken<string>();
    const token2 = createContextToken<string>();
    const dependency1 = createReader(_ => 'test_1');
    const dependency2 = createReader(_ => 'test_2');

    // when
    const context = await contextFactory(
      bindTo(token1)(dependency1),
      bindTo(token2)(dependency2),
    );

    // then
    expect(size(context)).toEqual(3);
    expect(lookup(context)(LoggerToken)).toEqual(O.some(expect.anything()));
    expect(lookup(context)(token1)).toEqual(O.some('test_1'));
    expect(lookup(context)(token2)).toEqual(O.some('test_2'));
  });

  test('resolves async dependencies', async () => {
    // given
    const token1 = createContextToken('token_1');
    const token2 = createContextToken('token_2');
    const token3 = createContextToken('token_3');

    // 1. "raw" Reader
    const dependency1 = pipe(R.ask<Context>(), R.map(async _ => token1.name));

    // 2. createReader
    const dependency2 = createReader(async _ => await Promise.resolve(token2.name));

    // 3. async factory function
    const dependency3 = async () => token3.name;

    // when
    const context = await contextFactory(
      bindEagerlyTo(token1)(dependency1),
      bindEagerlyTo(token2)(dependency2),
      bindEagerlyTo(token3)(dependency3),
    );

    // then
    expect(lookup(context)(token1)).toEqual(O.some(token1.name));
    expect(lookup(context)(token2)).toEqual(O.some(token2.name));
    expect(lookup(context)(token3)).toEqual(O.some(token3.name));
  });
});

describe('#constructContext', () => {
  test('constructs new context from already existing one and allows to read all new and derived dependencies', async () => {
    // given
    const token1 = createContextToken<string>();
    const token2 = createContextToken<string>();
    const dependency1 = createReader(_ => 'test_1');
    const dependency2 = createReader(_ => 'test_2');

    const derivedContext = await contextFactory(
      bindTo(token1)(dependency1),
    );

    // when
    const context = await constructContext(derivedContext)(
      bindTo(token2)(dependency2),
    );

    // then
    expect(size(context)).toEqual(3);
    expect(lookup(context)(LoggerToken)).toEqual(O.some(expect.anything()));
    expect(lookup(context)(token1)).toEqual(O.some('test_1'));
    expect(lookup(context)(token2)).toEqual(O.some('test_2'));
  });

  test('doesn\'t register redundant LoggerToken if derived context has it already bound ', async () => {
    // given
    const customLogger = jest.fn(() => 'custom_logger');
    const derivedContext = await contextFactory(
      bindEagerlyTo(LoggerToken)(() => customLogger()),
    );

    // when
    const context = await constructContext(derivedContext)(
      bindEagerlyTo(DerivedContextToken)(() => derivedContext),
    );

    // then
    expect(
      lookup(derivedContext)(LoggerToken)
    ).toEqual(
      lookup(context)(LoggerToken)
    );

    expect(size(context)).toEqual(1);        // Context[DerivedContextToken]
    expect(size(derivedContext)).toEqual(1); // DerivedContext[Loggertoken]
    expect(customLogger).toHaveBeenCalledTimes(1);
  });

  test('registers default LoggerToken if derived context doesn\'t have it already bound', async () => {
    // given
    const derivedContext = createContext();

    // when
    const context = await constructContext()(
      bindEagerlyTo(DerivedContextToken)(() => derivedContext),
    );

    // then
    expect(lookup(derivedContext)(LoggerToken)).toEqual(O.none);
    expect(lookup(context)(LoggerToken)).toEqual(O.some(expect.anything()));

    expect(size(context)).toEqual(2);        // Context[DerivedContextToken, Loggertoken]
    expect(size(derivedContext)).toEqual(0); // DerivedContext[]
  });
});
