import { isNonNullable, isNullable } from '../any.util';

test('#isNonNullable', () => {
  expect(isNonNullable({})).toBe(true);
  expect(isNonNullable(2)).toBe(true);
  expect(isNonNullable('test')).toBe(true);
  expect(isNonNullable('')).toBe(true);
  expect(isNonNullable(false)).toBe(true);
  expect(isNonNullable(null)).toBe(false);
  expect(isNonNullable(undefined)).toBe(false);
});

test('#isNullable', () => {
  expect(isNullable({})).toBe(false);
  expect(isNullable(2)).toBe(false);
  expect(isNullable('test')).toBe(false);
  expect(isNullable('')).toBe(false);
  expect(isNullable(false)).toBe(false);
  expect(isNullable(null)).toBe(true);
  expect(isNullable(undefined)).toBe(true);
});
