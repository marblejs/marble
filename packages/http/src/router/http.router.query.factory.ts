import * as qs from 'qs';
import { pipe } from 'fp-ts/lib/function';
import { fromNullable, map, getOrElse } from 'fp-ts/lib/Option';
import { QueryParameters } from '../http.interface';

export const queryParamsFactory = (queryParams: string | undefined | null): QueryParameters => pipe(
  fromNullable(queryParams),
  map(qs.parse),
  getOrElse(() => ({})),
);
