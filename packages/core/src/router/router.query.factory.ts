import * as querystring from 'querystring';
import { Nullable, Maybe, getHead } from '../+internal';
import { QueryParameters } from '../http.interface';

const getNestedQueryParam = (params: Object) => (key: string): QueryParameters => {
  const paramValue = params[key];
  const nestedKeys = /\[.*]/.exec(key);

  return Maybe.of(nestedKeys)
    .flatMap(getHead)
    .map(_ => _.replace(/\[/g, ''))
    .map(_ => _.split(']'))
    .map(_ => _.filter(v => v.length > 0))
    .map(_ => _.reduceRight(
      (value, key) => ({ [key]: value }),
      paramValue,
    ))
    .flatMap(nestedQueryObject => Maybe.of(nestedKeys)
      .flatMap(getHead)
      .map(head => key.replace(head, ''))
      .map(key => ({ [key]: nestedQueryObject }))
    )
    .valueOr({ [key]: paramValue });
};

const extractNestedQueryParams = (queryParams: Object): QueryParameters =>
  Object.assign(
    {},
    ...Object.keys(queryParams).map(getNestedQueryParam(queryParams))
  );

export const queryParamsFactory = (queryParams: Nullable<string>): QueryParameters =>
  Maybe.of(queryParams)
    .map(querystring.parse)
    .map(extractNestedQueryParams)
    .valueOr({});
