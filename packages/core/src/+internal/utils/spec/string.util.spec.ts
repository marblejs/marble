import { isString, trim, stringify, createUuid } from '../string.util';

test('#isString check is given argument is of string type', () => {
  expect(isString('some string value')).toBe(true);
  expect(isString(7)).toBe(false);
  expect(isString(true)).toBe(false);
  expect(isString({})).toBe(false);
  expect(isString(null)).toBe(false);
  expect(isString(undefined)).toBe(false);
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
