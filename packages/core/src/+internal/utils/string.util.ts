import { v4 as uuid } from 'uuid';
import { flow } from 'fp-ts/lib/function';
import { fromNullable, getOrElse } from 'fp-ts/lib/Option';

export const isString = (value: any): value is string =>
  typeof value === 'string' || value instanceof String;

export const trim = (strings: TemplateStringsArray, ...values: any[]) => {
  const notNilValues = values.map(flow(fromNullable, getOrElse(() => '')));
  const interpolation = strings.reduce(
    (prev, current) => prev + current + (notNilValues.length ? notNilValues.shift() : ''), '',
  );

  return interpolation.trim();
};

export const trunc = (n: number) => (input: string) =>
  (input.length > n)
    ? input.substr(0, n) + '…'
    : input;

export const stringify = (value: any): string =>
  typeof value === 'function'
    ? (value.displayName || value.name)
    : JSON.stringify(value);

export const createUuid = () => uuid();

export const maskUriComponent = (type: 'authorization') => (uri: string): string => {
  switch (type) {
    case 'authorization':
      return uri.replace(/\/\/(.*)\@/, '//[user]:[pass]@');
    default:
      return uri;
  }
}
