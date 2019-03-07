export const capitalize = (str: string): string =>
  str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');

export const isString = (str: any): boolean =>
  typeof str === 'string' || str instanceof String;
