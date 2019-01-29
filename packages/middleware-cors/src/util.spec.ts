import { capitalize, isNotEmptyArray } from './util';
import { isString } from 'util';

describe('Utils', () => {
  describe('Capitalize', () => {
    test('should capitalize a header correctly', done => {
      const header = 'capitalize-any-header';
      expect(capitalize(header)).toEqual('Capitalize-Any-Header');
      done();
    });
  });

  describe('isArrayNotEmpty', () => {
    test('should return false for any other type', done => {
      const obj = {};
      const num = 42;
      const str = '42';
      const n = null;
      expect(isNotEmptyArray(obj)).toBeFalsy();
      expect(isNotEmptyArray(num)).toBeFalsy();
      expect(isNotEmptyArray(str)).toBeFalsy();
      expect(isNotEmptyArray(n)).toBeFalsy();
      done();
    });

    test('should return false for an empty array', done => {
      const array = [];
      expect(isNotEmptyArray(array)).toBeFalsy();
      done();
    });

    test('should return true for a not empty array', done => {
      const array = ['capitalize-any-header'];
      expect(isNotEmptyArray(array)).toBeTruthy();
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
      expect(isNotEmptyArray(obj)).toBeFalsy();
      expect(isNotEmptyArray(num)).toBeFalsy();
      expect(isNotEmptyArray(arr)).toBeFalsy();
      expect(isNotEmptyArray(n)).toBeFalsy();
      done();
    });
  });
});
