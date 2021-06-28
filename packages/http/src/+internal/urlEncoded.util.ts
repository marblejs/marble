import * as qs from 'qs';
import { isString } from '@marblejs/core/dist/+internal/utils';

export const transformUrlEncoded = (data: any): string =>
  !isString(data) ? qs.stringify(data) : data;
