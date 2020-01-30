import { isError } from '../error.util';

describe('#isError', () => {
  const cases: [any, boolean][] = [
    [{}, false],
    [new (class Foo { stack = [] }), false],
    [new Error(), true],
    [new Error('test'), true],
  ];

  test.each(cases)('given %p as argument, returns %p', (data, expected) =>
    expect(isError(data)).toEqual(expected));
});
