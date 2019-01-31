import { HttpRequest } from '@marblejs/core';
import { isString } from 'util';

export const checkOrigin = (
  req: HttpRequest,
  option: string | string[] | RegExp,
): boolean => {
  const origin = req.headers.origin as string;

  if (isString(option) && option === '*') {
    return true;
  } else if (
    isString(option) &&
    option !== '*' &&
    origin.match(option as string)
  ) {
    return true;
  } else if (
    Array.isArray(option) &&
    option.length > 0 &&
    option.includes(origin)
  ) {
    return true;
  } else if (option instanceof RegExp && option.test(origin)) {
    return true;
  }

  return false;
};
