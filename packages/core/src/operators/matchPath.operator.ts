import * as pathToRegexp from 'path-to-regexp';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { HttpRequest, HttpParameters, HttpRoute } from '../http.interface';

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

const getParams = (params: RegExpMatchArray | null, routes: pathToRegexp.Token[]): HttpParameters => {
  if (!params || !routes) { return {}; }

  return routes
    .filter(route => route.hasOwnProperty('name'))
    .reduce((obj, route, index) => ({
      ...obj,
      [route['name']]: params[index],
    }), {});
};

const getRoute = (req: HttpRequest, path: string, opts: MatcherOpts = {}): HttpRoute => {
  const match = pathFactory(req.matchers!, path, opts.suffix);
  const url = urlFactory(req.url!);
  const params = pathToRegexp(match).exec(url);
  const routes = pathToRegexp.parse(match);

  return {
    url: req.url,
    params: getParams(params, routes),
  };
};

export const matchPath = (path: string, opts: MatcherOpts = {}) => (source$: Observable<HttpRequest>) =>
  source$.pipe(
    tap(req => req.matchers = req.matchers || []),
    filter(req => {
      const match = pathFactory(req.matchers!, path, opts.suffix);
      const url = urlFactory(req.url!);
      return pathToRegexp(match).test(url);
    }),
    tap(req => req.route = getRoute(req, path, opts)),
    tap(req => opts.combiner && req.matchers!.push(path))
  );
