import { ParametricRegExp } from './router.interface';

export const factorizeRegExpWithParams = (path: string): ParametricRegExp => {
  // Matches all path params, if they're followed by a series of star characters, stars are omitted in parameter name
  const pathParameters = /:([^\/*]+)[*]*/g;
  // Matches only star path params (including stars in group)
  const starParameters = /:([^\/*]+[*]*)/g;
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
    .replace(starParameters, `(.+)`) /* Translate star path parameters to regex groups not limited by slashes */
    .replace(/\*/g, '.*?')  /* Translate all stars to a wildcard */
    .replace(/\/{2,}/g, '/') /* Remove duplicated backslashes */
    .replace(/([/\\])$/, '$1?'); /* Last slash/backslash is always optional */

  return {
    regExp: new RegExp('^' + pattern + '$'),
    parameters: parameters.length > 0 ? parameters : undefined,
  };
};
