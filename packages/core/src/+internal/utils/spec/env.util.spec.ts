import { IO } from 'fp-ts/IO';
import { Option, getOrElse } from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { envConfig, envConfigEither, envConfigEitherAsBoolean } from '../env.util';

test('read env variable once', () => {
  const fooEnv: IO<Option<string>> = envConfig('Foo');

  process.env.Foo = 'Foo';
  expect(pipe(fooEnv(), getOrElse(() => 'Env Foo not defined'))).toBe('Foo');

  process.env.Foo = 'Bar';
  // env variable is only read once so it should return the old value
  expect(pipe(fooEnv(), getOrElse(() => 'Env Foo not defined'))).toBe('Foo');
});

test('read nullable env variable once', () => {
  const fooEnv: IO<Option<string>> = envConfig('Foo');

  delete process.env.Foo;
  expect(pipe(fooEnv(), getOrElse(() => 'Env Foo not defined'))).toBe('Env Foo not defined');

  process.env.Foo = 'Test Test';
  // env variable is only read once so it should return the old value
  expect(pipe(fooEnv(), getOrElse(() => 'Env Foo not defined'))).toBe('Env Foo not defined');
});


test('read nullable env with fallback value', () => {
  const fooEnv: IO<string> = envConfigEither('Foo', 'Fallback Value');

  delete process.env.Foo;
  expect(fooEnv()).toBe('Fallback Value');

  process.env.Foo = 'Test Test';
  expect(fooEnv()).toBe('Test Test');

  delete process.env.Foo;
  expect(fooEnv()).toBe('Fallback Value');

  process.env.Foo = '123';
  expect(fooEnv()).toBe('123');
});

test('read env with boolean fallback value', () => {
  const fooEnv: IO<boolean> = envConfigEitherAsBoolean('FooBool', false);

  delete process.env.FooBool;
  expect(fooEnv()).toBe(false);

  process.env.FooBool = 'true';
  expect(fooEnv()).toBe(true);

  delete process.env.FooBool;
  expect(fooEnv()).toBe(false);

  process.env.FooBool = 'TrUe'; // matching is case insensitive
  expect(fooEnv()).toBe(true);
});
