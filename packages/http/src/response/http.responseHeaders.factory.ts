import * as O from 'fp-ts/lib/Option';
import * as IO from 'fp-ts/lib/IO';
import { constant, pipe } from 'fp-ts/lib/function';
import { isStream, isEmpty, getEnvConfigOrElseAsBoolean, isString } from '@marblejs/core/dist/+internal/utils';
import { ContentType, getContentLength, getContentType, getMimeType } from '../+internal/contentType.util';
import { normalizeHeaders } from '../+internal/header.util';
import { HttpHeaders, HttpStatus } from '../http.interface';

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

const provideContentLengthHeader = (response: HttpResponseLike): HttpHeaders => {
  if (isStream(response.body)) return {};

  const contentLength = isEmpty(response.body) ? 0 : Buffer.byteLength(
    isString(response.body) || Buffer.isBuffer(response.body)
      ? response.body
      : JSON.stringify(response.body)
  );

  return {
    'Content-Length': contentLength,
  };
};

export const provideContentTypeHeader = (response: HttpResponseLike): HttpHeaders => {
  const contentType = response.status < 400
    ? getMimeType(response.body, response.path)
    : DEFAULT_HEADERS['Content-Type'];

  return {
    'Content-Type': contentType ?? DEFAULT_HEADERS['Content-Type'],
  };
};

export const factorizeHeaders = (response: HttpResponseLike) => (providedHeaders?: HttpHeaders): IO.IO<HttpHeaders> => {
  const defaultContentTypeHeaders = pipe(
    O.fromNullable(providedHeaders),
    O.chain(getContentType),
    O.fold(
      () => ({
        ...provideContentTypeHeader(response),
        ...provideContentLengthHeader(response),
      }),
      () => pipe(
        O.fromNullable(providedHeaders),
        O.chain(getContentLength),
        O.fold(
          () => ({ ...provideContentLengthHeader(response) }),
          constant({}),
        )
      )),
    );


  const mergedHeaders = {
    ...DEFAULT_HEADERS,
    ...defaultContentTypeHeaders,
    ...providedHeaders,
  };

  return pipe(
    useHttpHeadersNormalization,
    IO.map(shouldNormalize => shouldNormalize ? normalizeHeaders(mergedHeaders) : mergedHeaders),
  );
};
