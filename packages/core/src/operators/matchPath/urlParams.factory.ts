import * as pathToRegexp from 'path-to-regexp';
import { HttpRequest, RouteParameters } from '../../http.interface';
import { matcherFactory, removeQueryParams } from './matcher.factory';

export const urlParamsFactory = (
  req: HttpRequest,
  path: string
): RouteParameters => {
  const match = matcherFactory(req.matchers!, path);
  const url = removeQueryParams(req.url!);
  const params = pathToRegexp(match).exec(url);
  const routes = pathToRegexp.parse(match);

  if (!params || !routes) {
    return {};
  }

  return routes.filter(route => route.hasOwnProperty('name')).reduce(
    (obj, route, index) => ({
      ...obj,
      [route['name']]: params[++index]
    }),
    {}
  );
};
