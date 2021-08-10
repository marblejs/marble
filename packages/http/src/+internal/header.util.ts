import { pipe } from 'fp-ts/lib/function';
import { toUndefined } from 'fp-ts/lib/Option';
import { TESTING_REQUEST_ID_HEADER } from '@marblejs/core/dist/+internal/testing';
import { getHead } from '@marblejs/core/dist/+internal/utils';
import { HttpRequest } from '../http.interface';

type GetHeaderValue<Value extends string = string> = (req: HttpRequest) => Value | undefined;

export const getHeaderValueHead = (key: string): GetHeaderValue => req => {
  const header = req.headers[key.toLowerCase()];

  return Array.isArray(header)
    ? pipe(getHead(header), toUndefined)
    : header;
};

export const getTestingRequestIdHeader: GetHeaderValue =
  getHeaderValueHead(TESTING_REQUEST_ID_HEADER);
