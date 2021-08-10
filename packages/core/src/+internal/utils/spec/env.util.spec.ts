import { IO } from 'fp-ts/IO';
import { pipe } from 'fp-ts/function';
import { Option, getOrElse } from 'fp-ts/Option';
import { getEnvConfig, getEnvConfigOrElse, getEnvConfigOrElseAsBoolean } from '../env.util';

beforeEach(() => delete process.env.Foo);

test('#getEnvConfig - reads env once', () => {
  const getFooEnv: IO<Option<string>> = getEnvConfig('Foo');

  process.env.Foo = 'Foo';
  expect(pipe(getFooEnv(), getOrElse(() => 'Env Foo not defined'))).toBe('Foo');

  delete process.env.Foo;
  // env variable is only read once so it should return the old value
  expect(pipe(getFooEnv(), getOrElse(() => 'Env Foo not defined'))).toBe('Foo');
});

test('#getEnvConfig - reads nullable env once', () => {
  const getFooEnv: IO<Option<string>> = getEnvConfig('Foo');

  delete process.env.Foo;
  expect(pipe(getFooEnv(), getOrElse(() => 'Env Foo not defined'))).toBe('Env Foo not defined');

  process.env.Foo = 'Foo';
  // env variable is only read once so it should return the old value
  expect(pipe(getFooEnv(), getOrElse(() => 'Env Foo not defined'))).toBe('Env Foo not defined');
});

test('#getEnvConfigOrElse - reads nullable env once', () => {
  const getFooEnv: IO<string> = getEnvConfigOrElse('Foo', 'Fallback Value');

  process.env.Foo = 'Foo';
  expect(getFooEnv()).toBe('Foo');

  delete process.env.Foo;
  expect(getFooEnv()).toBe('Foo');
});

test('#getEnvConfigOrElse - reads nullable env with fallback once', () => {
  const getFooEnv: IO<string> = getEnvConfigOrElse('Foo', 'Fallback Value');

  delete process.env.Foo;
  expect(getFooEnv()).toBe('Fallback Value');

  process.env.Foo = 'Foo';
  expect(getFooEnv()).toBe('Fallback Value');
});

test('#getEnvConfigOrElseAsBoolean - reads truthy env with fallback once', () => {
  const getFooEnv: IO<boolean> = getEnvConfigOrElseAsBoolean('Foo', false);

  process.env.Foo = 'true';
  expect(getFooEnv()).toBe(true);

  delete process.env.Foo;
  expect(getFooEnv()).toBe(true);
});

test('#getEnvConfigOrElseAsBoolean - reads falsy env with fallback once', () => {
  const getFooEnv: IO<boolean> = getEnvConfigOrElseAsBoolean('Foo', true);

  process.env.Foo = 'FALSE';
  expect(getFooEnv()).toBe(false);

  delete process.env.Foo;
  expect(getFooEnv()).toBe(false);
});

test('#getEnvConfigOrElseAsBoolean - reads boolean env with fallback once', () => {
  const getFooEnv: IO<boolean> = getEnvConfigOrElseAsBoolean('Foo', false);

  delete process.env.Foo;
  expect(getFooEnv()).toBe(false);

  process.env.Foo = 'true';
  expect(getFooEnv()).toBe(false);
});

