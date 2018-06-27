import { ParametricRegExp, RouteGroup, Routing, RouteCombinerConfig } from './router.interface';
export { Routing };

export const isRouteGroup = (item): item is RouteGroup =>
  Array.isArray(item.effects) &&
  Array.isArray(item.middlewares);

  export const isRouteCombinerConfig = (item): item is RouteCombinerConfig =>
    Array.isArray(item.effects) &&
    Array.isArray(item.middlewares);

export const createRegExpWithParams = (path: string): ParametricRegExp => {
  const pathParameters = /:([^\/]+)/g;
  const parameters: string[] = [];
  let pathParameterMatch;
  while ((pathParameterMatch = pathParameters.exec(path)) !== null) {
    parameters.push(pathParameterMatch[1]);
  }
  const pattern = path
    .replace(/\/\//g, '/') /* Remove duplicate backslashes */
    .replace(/\\\\/g, '\\') /* Remove duplicate slashes */
    .replace(/([?./\\()[\]{}^$])/g, '\\$1') /* Escape all regex characters */
    .replace(pathParameters, `([^\\/]+)`) /* Translate all path parameters to regex groups */
    .replace(/\*/g, '[^\\/]*')  /* Translate all stars to a wildcard */
    .replace(/([/\\])$/, '$1?'); /* Last slash/backslash is always optional */
  return {
    regExp: new RegExp('^' + pattern + '$'),
    parameters,
  };
};
