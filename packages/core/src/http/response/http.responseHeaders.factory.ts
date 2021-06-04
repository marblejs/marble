import { envConfigEitherAsBoolean } from '../../+internal/utils/env.util';
import { HttpHeaders, HttpStatus } from '../http.interface';
import { contentTypeFactory } from './http.responseContentType.factory';

/**
 * Flag to indicate whether we should convert all headers to lower case or not.
 * This flag was introduced to prevent breaking changes, for more details see:
 * https://github.com/marblejs/marble/issues/311
 *
 * Flag will be removed in the next major version,
 * where all headers are lower cased by default.
 */
const useLowerCaseHeadersOnly = envConfigEitherAsBoolean('MARBLE_HTTP_CASE_INSENSITIVE_HEADER_NAMES', false);


export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
};

export const headersFactory = (data: {
  body: any;
  path: string;
  status: HttpStatus;
}) => (headers?: HttpHeaders) => {
  const mergedHeaders = {
    ...DEFAULT_HEADERS,
    ...contentTypeFactory(data),
    ...headers
  };

  if (!useLowerCaseHeadersOnly()) {
    return mergedHeaders;
  }

  // lower case header
  const lowerCasedHeaders = {};
  Object.keys(mergedHeaders).forEach(h => {
    lowerCasedHeaders[h.toLowerCase()] = mergedHeaders[h];
  });

  return lowerCasedHeaders;
}
