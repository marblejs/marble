import * as pathToRegexp from 'path-to-regexp';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { HttpRequest } from '../http.interface';

type MatcherOpts = {
  suffix?: string,
  combiner?: boolean,
};

const removeTrailingSlash = (path: string): string =>
  path.replace(/\/$/, '');

const removeQueryParams = (path: string): string =>
  path.split('?')[0];

const pathFactory = (matchers: string[], path: string, suffix?: string): string =>
  removeTrailingSlash(
    matchers.reduce((prev, cur) => prev + cur, '')
    + path + (suffix || '')
  );

const urlFactory = (path: string): string =>
  removeQueryParams(path);

export const matchPath = (path: string, opts: MatcherOpts = {}) => (source$: Observable<HttpRequest>) =>
  source$.pipe(
    tap(req => req.matchers = req.matchers || []),
    filter(req => {
      const match = pathFactory(req.matchers!, path, opts.suffix);
      const url = urlFactory(req.url!);
      return pathToRegexp(match).test(url);
    }),
    tap(req => opts.combiner && req.matchers!.push(path))
  );
