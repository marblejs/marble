import { isString } from './string.util';

export class NamedError extends Error {
  constructor(public name: string, message: string) {
    super(message);
  }
}

export const isNamedError = (data: any): data is NamedError =>
  !!data?.name && !!data?.message;

export const isError = (data: any): data is Error =>
  !!data?.stack && !!data?.name;

export const encodeError = (error: any) =>
  !isError(error) ? error : ['name', ...Object.getOwnPropertyNames(error)]
    .filter(key => !['stack'].includes(key))
    .reduce((acc, key) => {
      acc[key] = error[key];
      return acc;
    }, Object.create(null));

export const throwException = (error: any) => { throw error; };

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : isString(error)
      ? error
      : JSON.stringify(error);
