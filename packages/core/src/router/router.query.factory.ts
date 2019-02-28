import * as qs from 'qs';
import { QueryParameters } from '../http.interface';
import { fromNullable } from 'fp-ts/lib/Option';

export const queryParamsFactory = (queryParams: string | undefined | null): QueryParameters =>
  fromNullable(queryParams)
    .map(qs.parse)
    .getOrElse({});
