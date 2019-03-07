import { isString } from './util';

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
