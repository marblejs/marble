export const removeTrailingSlash = (path: string): string =>
  path.replace(/\/$/, '');

export const removeQueryParams = (path: string): string => path.split('?')[0];

export const matcherFactory = (
  matchingHistory: string[],
  pathToMatch: string,
  suffix?: string
): string =>
  removeTrailingSlash(
    matchingHistory.reduce((prev, cur) => prev + cur, '') +
      removeTrailingSlash(pathToMatch) +
      (suffix || '')
  );
