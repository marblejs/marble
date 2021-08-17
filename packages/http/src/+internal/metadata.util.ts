import { JSONSchema7 } from 'json-schema';
import { IO } from 'fp-ts/lib/IO';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { HttpHeaders } from '../http.interface';
import { MARBLE_HTTP_REQUEST_METADATA_ENV_KEY } from '../http.config';
import { getHeaderValue } from './header.util';

export interface RequestMetadata {
  path?: string;
  body?: JSONSchema7;
  headers?: JSONSchema7;
  params?: JSONSchema7;
  query?: JSONSchema7;
}

export const HTTP_REQUEST_METADATA_ID_HEADER_KEY = 'X-Request-Metadata-Id';

/**
 * Creates random request metadata header entry
 *
 * @returns headers `HttpHeaders`
 */
export const createRequestMetadataHeader: IO<HttpHeaders> = (): HttpHeaders => ({
  [HTTP_REQUEST_METADATA_ID_HEADER_KEY]: createUuid(),
});

/**
 * Get custom request metadata header value
 *
 * @param headers `HttpHeaders`
 * @returns optional header value
 */
 export const getHttpRequestMetadataIdHeader =
  getHeaderValue(HTTP_REQUEST_METADATA_ID_HEADER_KEY);

/**
 * Activates `MARBLE_HTTP_REQUEST_METADATA_ENV_KEY` environment variable
 *
 * @returns `void`
 */
export const enableHttpRequestMetadata: IO<void> = () =>
  process.env[MARBLE_HTTP_REQUEST_METADATA_ENV_KEY] = 'true';
