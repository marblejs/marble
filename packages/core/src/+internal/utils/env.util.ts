import * as IO from 'fp-ts/IO';
import { Option, fromNullable, getOrElse } from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

function memoize<A>(ma: IO.IO<A>): IO.IO<A> {
  let cache: A;
  let isMemoized = false;

  return () => {
    if (!isMemoized) {
      cache = ma();
      isMemoized = true;
    }

    return cache;
  };
}

/**
 * Read env config (but only once, value is cached)
 *
 * @param key - env variable to read.
 * @see getEnvConfigOrElse
 */
export const getEnvConfig = (envKey: string): IO.IO<Option<string>> =>
  memoize(() => fromNullable(process.env[envKey]));

/**
 * Read env config with fallback value in case it is not defined.
 *
 * @param envKey
 * @param onNone
 * @see getEnvConfig
 */
export const getEnvConfigOrElse = (envKey: string, onNone: string): IO.IO<string> =>
  pipe(
    getEnvConfig(envKey),
    IO.map(getOrElse(() => onNone)),
  );

/**
 * Read env config using #getEnvConfigOrElse and converts the value to boolean
 * defined value must be "true" (case insensitive) to be true.
 *
 * @param envKey
 * @param onNone
 * @see getEnvConfigOrElse
 */
export const getEnvConfigOrElseAsBoolean = (envKey: string, onNone: 'false' | 'true' | true | false): IO.IO<boolean> =>
  pipe(
    getEnvConfigOrElse(envKey, String(onNone)),
    IO.map(val => val.toLowerCase() === 'true'),
  );
