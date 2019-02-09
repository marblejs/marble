import { HttpRequest } from '@marblejs/core';
import { checkStringOrigin } from './checkStringOrigin';
import { checkArrayOrigin } from './checkArrayOrigin';
import { checkRegexpOrigin } from './checkRegexpOrigin';

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
