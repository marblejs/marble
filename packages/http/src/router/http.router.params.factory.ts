import { pathToRegexp, Key } from 'path-to-regexp';
import { ParametricRegExp } from './http.router.interface';

export const factorizeRegExpWithParams = (path: string): ParametricRegExp => {
  const keys: Key[] = [];
  const preparedPath = path
    .replace(/\/\*/g, '/(.*)') /* Transfer wildcards */
    .replace(/\/\/+/g, '/') /* Remove repeated backslashes */
    .replace(/\/$/, ''); /* Remove trailing backslash */

  const regExp = pathToRegexp(preparedPath, keys, { strict: false });
  const regExpParameters = keys
    .filter(key => key.name !== 0) /* Filter wildcard groups */
    .map(key => String(key.name));

  return {
    regExp,
    parameters: regExpParameters.length > 0 ? regExpParameters : undefined,
    path: preparedPath,
  };
};
