export class NamedError extends Error {
  constructor(public name: string, public message: string) {
    super(message);
  }
}

export const isNamedError = (data: any): data is NamedError =>
  !!data?.name && !!data?.message;

export const isError = (data: any): data is Error =>
  !!data?.stack && !!data?.name;

export const encodeError = (error: any) =>
  ['name', ...Object.getOwnPropertyNames(error)]
    .filter(key => !['stack'].includes(key))
    .reduce((acc, key) => {
      acc[key] = error[key];
      return acc;
    }, Object.create(null));
