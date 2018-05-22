const removeTrailingSlash = (path: string): string =>
  path.replace(/\/$/, '');

const removeQueryParams = (path: string): string =>
  path.split('?')[0];

export const pathFactory = (matchers: string[], path: string, suffix?: string): string =>
  removeTrailingSlash(
    matchers.reduce((prev, cur) => prev + cur, '')
    + path + (suffix || '')
  );

export const urlFactory = (path: string): string =>
  removeQueryParams(path);
