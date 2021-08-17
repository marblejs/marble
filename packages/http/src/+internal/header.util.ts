import * as O from 'fp-ts/lib/Option';
import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import { HttpHeaders } from '../http.interface';

/**
 * Get header value for given key from provided headers object
 *
 * @param key header key
 * @since 4.0.0
 */
 export const getHeaderValue = <T extends string = string>(key: string) => (headers: HttpHeaders): O.Option<T> =>
  pipe(
    O.fromNullable(headers[key] ?? headers[key.toLowerCase()]),
    O.chain(value => Array.isArray(value)
      ? A.head(value) as O.Option<T>
      : O.some(String(value)) as O.Option<T>),
  );

/**
 * Normalize HTTP headers (transform keys to lowercase)
 *
 * @param headers
 * @since 4.0.0
 */
export const normalizeHeaders = (headers: HttpHeaders): HttpHeaders =>
  pipe(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
    Object.fromEntries,
  );
