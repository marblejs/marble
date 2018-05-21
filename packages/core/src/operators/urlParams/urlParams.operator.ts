import * as pathToRegexp from 'path-to-regexp';
import { RouteParameters } from '../../http.interface';

export const urlParams = (params: RegExpMatchArray | null, routes: pathToRegexp.Token[]): RouteParameters => {
  if (!params || !routes) { return {}; }

  return routes
    .filter(route => route.hasOwnProperty('name'))
    .reduce((obj, route, index) => ({
      ...obj,
      [route['name']]: params[++index],
    }), {});
};
