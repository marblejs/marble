export const checkArrayOrigin = (
  origin: string,
  option: string | string[] | RegExp,
): boolean =>
  Array.isArray(option) && option.length > 0 && option.includes(origin)
    ? true
    : false;
