export const checkRegexpOrigin = (
  origin: string,
  option: string | string[] | RegExp,
): boolean => (option instanceof RegExp && option.test(origin) ? true : false);
