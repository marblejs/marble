import { compose } from '../../util/compose.util';

export const applyPath = (path: string) => (url: string) => url + path;

export const applySuffix = (suffix?: string) => (url: string) => url + (suffix || '');

export const removeQueryParams = (url: string) => url.split('?')[0];

export const removeTrailingSlash = (url: string) => url.replace(/\/$/, '');

export const constructMatcher = (history: string[]) => history.reduce((prev, cur) => prev + cur, '');

export const matcherFactory = (
  matchingHistory: string[],
  pathToMatch: string,
  suffix?: string
) =>
  compose(
    applySuffix(suffix),
    removeTrailingSlash,
    applyPath(pathToMatch),
    constructMatcher,
  )(matchingHistory);
