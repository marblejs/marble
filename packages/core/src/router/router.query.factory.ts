import * as qs from 'qs';
import { QueryParameters } from '../http.interface';
import { pipe } from 'fp-ts/lib/pipeable';
import { fromNullable, map, getOrElse } from 'fp-ts/lib/Option';

export const queryParamsFactory = (queryParams: string | undefined | null): QueryParameters => pipe(
  fromNullable(queryParams),
  map(qs.parse),
  getOrElse(() => ({})),
);
