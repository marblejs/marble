import { IO } from 'fp-ts/IO';
import { Option, fromNullable, getOrElse } from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

function memoize<A>(ma: IO<A>): IO<A> {
  let cache: A;
  let done = false;

  return () => {
    if (!done) {
      cache = ma()
      done = true
    }

    return cache;
  }
}

/**
 * read env config (but only once, value is cached)
 *
 * @param key - env variable to read.
 *
 * @see envConfigEither
 */
export const envConfig: (envKey: string) => IO<Option<string>> = (envKey) => memoize<Option<string>>(() => {
  return fromNullable(process.env[envKey])
});

/**
 * read env config with fallback value in case it is not defined.
 *
 * @param envKey
 * @param onNone
 *
 * @see envConfig
 */
export const envConfigEither: (envKey: string, onNone: string) => IO<string> = (envKey, onNone) =>
  () => pipe(envConfig(envKey)(), getOrElse(() => onNone));

/**
 * read env config using #envConfigEither and converts the value to boolean
 * defined value must be "true" (case insensitive) to be true.
 * @param envKey
 * @param onNone
 *
 * @see envConfigEither
 */
export const envConfigEitherAsBoolean: (envKey: string, onNone: boolean) => IO<boolean> = (envKey, onNone) => () => pipe(
  envConfigEither(envKey, onNone + '')(),
  val => {
    return val.toLowerCase() === 'true';
  }
);
