import { getEnvConfigOrElseAsBoolean } from '@marblejs/core/dist/+internal/utils';
import { IO } from 'fp-ts/lib/IO';

/**
 * Flag to indicate whether we should prevent converting (normalizing) all headers to lower case.
 * This flag was introduced to prevent breaking changes, for more details see:
 * https://github.com/marblejs/marble/issues/311
 *
 * Flag will be removed in the next major version,
 * where all headers are normalized by default.
 *
 * @since 4.0.0
 */
export const MARBLE_HTTP_HEADERS_NORMALIZATION_ENV_KEY = 'MARBLE_HTTP_HEADERS_NORMALIZATION';

/**
 * If enabled applies request metadata to every outgoing HTTP response
 *
 * @since 2.0.0
 */
export const MARBLE_HTTP_REQUEST_METADATA_ENV_KEY = 'MARBLE_HTTP_REQUEST_METADATA';

type HttpModuleConfiguration = Readonly<{
  useHttpHeadersNormalization: IO<boolean>;
  useHttpRequestMetadata: IO<boolean>;
}>;

/**
 * Initialize and provide environment configuration
 *
 * @since 4.0.0
 */
export const provideConfig: IO<HttpModuleConfiguration> = () => ({
  useHttpHeadersNormalization: getEnvConfigOrElseAsBoolean(MARBLE_HTTP_HEADERS_NORMALIZATION_ENV_KEY, true),
  useHttpRequestMetadata: getEnvConfigOrElseAsBoolean(MARBLE_HTTP_REQUEST_METADATA_ENV_KEY, false),
});
