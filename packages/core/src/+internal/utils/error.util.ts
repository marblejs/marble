export class ExtendableError extends Error {
  constructor(public name: string, message: string) {
    super(message);
  }
}

export const isExtendableError = (data: any): data is ExtendableError =>
  !!data?.name && !!data?.message;

export const isError = (data: any): data is Error =>
  !!data?.stack && !!data?.name;
