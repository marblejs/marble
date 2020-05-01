import * as O from 'fp-ts/lib/Option';
import { size } from 'fp-ts/lib/Map';
import { createContextToken } from '../context.token.factory';
import { createReader } from '../context.reader.factory';
import { contextFactory } from '../context.factory.helper';
import { bindTo, lookup } from '../context.factory';
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
});
