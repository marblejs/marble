import * as O from 'fp-ts/lib/Option';
import * as IO from 'fp-ts/lib/IO';
import { constant, pipe } from 'fp-ts/lib/function';
import { isStream, isString, isNullable } from '@marblejs/core/dist/+internal/utils';
import { ContentType, getContentLength, getContentType, getMimeType } from '../+internal/contentType.util';
import { normalizeHeaders } from '../+internal/header.util';
import { HttpHeaders, HttpStatus } from '../http.interface';
import { provideConfig } from '../http.config';

interface HttpResponseLike {
  body: any;
  path: string;
  status: HttpStatus;
  headers?: HttpHeaders;
}

export const DEFAULT_HEADERS = {
  'Content-Type': ContentType.APPLICATION_JSON,
  'X-Content-Type-Options': 'nosniff',
};

const config = provideConfig();

export const provideContentLengthHeader = (response: HttpResponseLike): HttpHeaders => {
  if (isStream(response.body)) return {};

  const contentLength = isNullable(response.body) ? 0 : Buffer.byteLength(
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

export const factorizeHeaders = (response: HttpResponseLike): IO.IO<HttpHeaders> => {
  const defaultContentTypeHeaders = pipe(
    O.fromNullable(response.headers),
    O.chain(getContentType),
    O.fold(
      () => ({
        ...provideContentTypeHeader(response),
        ...provideContentLengthHeader(response),
      }),
      () => pipe(
        O.fromNullable(response.headers),
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
    ...response.headers,
  };

  return pipe(
    config.useHttpHeadersNormalization,
    IO.map(shouldNormalize => shouldNormalize ? normalizeHeaders(mergedHeaders) : mergedHeaders),
  );
};
