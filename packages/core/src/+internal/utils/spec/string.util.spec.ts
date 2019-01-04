import { isString, trim } from '../string.util';

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
