import * as pathToRegexp from 'path-to-regexp';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { HttpRequest } from '../http.interface';

const removeTrailingSlash = (path: string) =>
  path.replace(/\/$/, '');

const pathFactory = (matchers: string[], path: string, suffix?: string) =>
  matchers.reduce((prev, cur) => prev + cur, '') + path + (suffix || '');

export const matchPath = (path: string, suffix?: string) => (source$: Observable<HttpRequest>) =>
  source$.pipe(
    tap(req => req.matchers = req.matchers || []),
    filter(req => {
      const mappedPaths = removeTrailingSlash(pathFactory(req.matchers!, path, suffix));
      return pathToRegexp(mappedPaths).test(req.url!);
    }),
    tap(req => (path !== '/') && req.matchers!.push(path))
  );
