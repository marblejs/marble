import * as querystring from 'querystring';
import { QueryParameters } from '../../http.interface';

const getNestedQueryParam = (key: string, paramValue: string | Object): string | Object => {
  const nestedKeys = /\[.*\]/.exec(key);

  if(!nestedKeys) return ({ [key]: paramValue });

  const extractedKeys = nestedKeys[0].replace(/\[/g, '').split(']').filter(v => v.length > 0);
  const nestedQueryObject = extractedKeys.reduceRight((value, key) => ({ [key]: value }), paramValue);

  return { [key.replace(nestedKeys[0], '')]: nestedQueryObject };
}

const queryParamsArrayToObject = (queryParams: Object): QueryParameters => {
  const queryParamsKey = Object.keys(queryParams);
  return {...queryParamsKey.map(key => getNestedQueryParam(key, queryParams[key]))};
}

export const queryParamsFactory = (path: string): QueryParameters => {
  const queryParamsString = path.split('?').pop();

  if (!queryParamsString) return {};

  const extractedQueryParams = querystring.parse(queryParamsString);

  return queryParamsArrayToObject(extractedQueryParams);
}
