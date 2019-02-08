import { HttpRequest } from '@marblejs/core';
import { isString } from 'util';

export const checkOrigin = (
  req: HttpRequest,
  option: string | string[] | RegExp,
): boolean => {
  const origin = req.headers.origin as string;

  return [
    checkStringOrigin,
    checkArrayOrigin,
    checkRegexpOrigin,
  ].some(check => check(origin, option));
};

export const checkStringOrigin = (
  origin: string,
  option: string | string[] | RegExp,
): boolean => {
  if (isString(option) && option === '*') {
    return true;
  } else if (
    isString(option) &&
    option !== '*' &&
    origin.match(option as string)
  ) {
    return true;
  }

  return false;
};

export const checkArrayOrigin = (
  origin: string,
  option: string | string[] | RegExp,
): boolean =>
  Array.isArray(option) && option.length > 0 && option.includes(origin)
    ? true
    : false;

export const checkRegexpOrigin = (
  origin: string,
  option: string | string[] | RegExp,
): boolean => (option instanceof RegExp && option.test(origin) ? true : false);
