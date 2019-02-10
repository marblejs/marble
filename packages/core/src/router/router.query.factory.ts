import * as querystring from 'querystring';
import { getHead } from '../+internal';
import { QueryParameters } from '../http.interface';
import { fromNullable } from 'fp-ts/lib/Option';

const getNestedQueryParam = (params: Object) => (key: string): QueryParameters => {
  const paramValue = params[key];
  const nestedKeys = /\[.*]/.exec(key);

  return fromNullable(nestedKeys)
    .chain(getHead)
    .map(_ => _.replace(/\[/g, ''))
    .map(_ => _.split(']'))
    .map(_ => _.filter(v => v.length > 0))
    .map(_ => _.reduceRight(
      (value, key) => ({ [key]: value }),
      paramValue,
    ))
    .chain(nestedQueryObject => fromNullable(nestedKeys)
      .chain(getHead)
      .map(head => key.replace(head, ''))
      .map(key => ({ [key]: nestedQueryObject }))
    )
    .getOrElse({ [key]: paramValue });
};

const extractNestedQueryParams = (queryParams: Object): QueryParameters =>
  Object.assign(
    {},
    ...Object.keys(queryParams).map(getNestedQueryParam(queryParams))
  );

export const queryParamsFactory = (queryParams: string | undefined | null): QueryParameters =>
  fromNullable(queryParams)
    .map(querystring.parse)
    .map(extractNestedQueryParams)
    .getOrElse({});
