import { isString, trim, stringify, createUuid, trunc } from '../string.util';

describe('#isString', () => {
  const cases: [any, boolean][] = [
    [6, false],
    ['6', true],
    [{}, false],
    [null, false],
    [true, false],
    [undefined, false],
    ['', true],
    ['some value', true],
  ];

  test.each(cases)('given %p as argument, returns %p', (data, expected) =>
    expect(isString(data)).toEqual(expected));
});

describe('#trunc', () => {
  const cases: [number, string, string][] = [
    [0, '', ''],
    [0, 'abc', ''],
    [1, 'abc', 'a…'],
    [2, 'abc', 'ab…'],
    [3, 'abc', 'abc'],
    [4, 'abc', 'abc'],
  ];

  test.each(cases)('given %p and %p as arguments, returns %p', (n, input, expected) =>
    expect(trunc(n)(input)).toEqual(expected));
});

test('#trim trims whitespaces and removes nil values', () => {
  expect(trim`  test  `).toEqual('test');
  expect(trim`\ntest\t`).toEqual('test');
  expect(trim` ${undefined} ${null} test ${'test'}`).toEqual('test test');
});

test('#stringify stringifies given value', () => {
  expect(stringify(false)).toEqual('false');
  expect(stringify(100)).toEqual('100');
  expect(stringify({ test: 'test' })).toEqual('{"test":"test"}');

  function knownFunction() { return null; }
  expect(stringify(knownFunction)).toEqual('knownFunction');

  const unknownFunction = function() { return null; };
  unknownFunction.displayName = 'unknownFunction';
  expect(stringify(unknownFunction)).toEqual('unknownFunction');
});

test('#createUuid creates unique identifier', () => {
  expect(createUuid()).toBeDefined();
});
