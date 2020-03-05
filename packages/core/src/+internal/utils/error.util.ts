export class NamedError extends Error {
  constructor(public name: string, message: string) {
    super(message);
  }
}

export const isNamedError = (data: any): data is NamedError =>
  !!data?.name && !!data?.message;

export const isError = (data: any): data is Error =>
  !!data?.stack && !!data?.name;
