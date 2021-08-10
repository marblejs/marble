import * as IO from 'fp-ts/lib/IO';
import { pipe } from 'fp-ts/lib/function';
import { isStream, isEmpty, getEnvConfigOrElseAsBoolean, isString } from '@marblejs/core/dist/+internal/utils';
import { ContentType } from '../+internal/contentType.util';
import { normalizeHeaders } from '../+internal/header.util';
import { HttpHeaders, HttpStatus } from '../http.interface';
import { contentTypeFactory } from './http.responseContentType.factory';

interface HttpResponseLike {
  body: any;
  path: string;
  status: HttpStatus;
}

export const DEFAULT_HEADERS = {
  'Content-Type': ContentType.APPLICATION_JSON,
  'X-Content-Type-Options': 'nosniff',
};

/**
 * Flag to indicate whether we should prevent converting (normalizing) all headers to lower case.
 * This flag was introduced to prevent breaking changes, for more details see:
 * https://github.com/marblejs/marble/issues/311
 *
 * Flag will be removed in the next major version,
 * where all headers are normalized by default.
 */
export const MARBLE_HTTP_HEADERS_NORMALIZATION_ENV_KEY = 'MARBLE_HTTP_HEADERS_NORMALIZATION';

const useHttpHeadersNormalization = getEnvConfigOrElseAsBoolean(MARBLE_HTTP_HEADERS_NORMALIZATION_ENV_KEY, true);

const getContentLengthHeader = (response: HttpResponseLike): HttpHeaders => {
  if (isStream(response.body)) return {};

  const contentLength = isEmpty(response.body) ? 0 : Buffer.byteLength(
    isString(response.body) || Buffer.isBuffer(response.body)
      ? response.body
      : JSON.stringify(response.body)
  );

  return { 'Content-Length': contentLength };
};

export const factorizeHeaders = (response: HttpResponseLike) => (headers?: HttpHeaders): IO.IO<HttpHeaders> => {
  const mergedHeaders = {
    ...DEFAULT_HEADERS,
    ...contentTypeFactory(response),
    ...getContentLengthHeader(response),
    ...headers,
  };

  return pipe(
    useHttpHeadersNormalization,
    IO.map(shouldNormalize => shouldNormalize ? normalizeHeaders(mergedHeaders) : mergedHeaders),
  );
};
