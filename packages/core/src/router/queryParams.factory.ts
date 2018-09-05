import * as querystring from 'querystring';
import { QueryParameters } from '../http.interface';
import { compose } from '@shared';

const parseQueryString = (query: string) => querystring.parse(query);

const getNestedQueryParam = (
  key: string,
  paramValue: string | Object
): string | Object => {
  const nestedKeys = /\[.*]/.exec(key);

  if (!nestedKeys) {
    return { [key]: paramValue };
  }

  const extractedKeys = nestedKeys[0]
    .replace(/\[/g, '')
    .split(']')
    .filter(v => v.length > 0);

  const nestedQueryObject = extractedKeys.reduceRight(
    (value, key) => ({ [key]: value }),
    paramValue
  );

  return { [key.replace(nestedKeys[0], '')]: nestedQueryObject };
};

const queryParamsArrayToObject = (queryParams: Object): QueryParameters => {
  const queryParamsKey = Object.keys(queryParams);
  return Object.assign(
    {},
    ...queryParamsKey.map(key => getNestedQueryParam(key, queryParams[key]))
  );
};

export const queryParamsFactory = (queryParams: string | undefined | null): QueryParameters =>
  !queryParams
    ? {}
    : compose(
    queryParamsArrayToObject,
    parseQueryString,
    )(queryParams);
