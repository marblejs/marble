import { capitalize, isString } from './util';

describe('Utils', () => {
  describe('Capitalize', () => {
    test('should capitalize a header correctly', done => {
      const header = 'capitalize-any-header';
      expect(capitalize(header)).toEqual('Capitalize-Any-Header');
      done();
    });
  });

  describe('isString', () => {
    test('should return true for a string', done => {
      const str = 'string';
      expect(isString(str)).toBeTruthy();
      done();
    });

    test('should return false for any other type', done => {
      const obj = {};
      const num = 42;
      const arr = [];
      const n = null;
      expect(isString(obj)).toBeFalsy();
      expect(isString(num)).toBeFalsy();
      expect(isString(arr)).toBeFalsy();
      expect(isString(n)).toBeFalsy();
      done();
    });
  });
});
