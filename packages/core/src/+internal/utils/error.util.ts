export class ExtendableError extends Error {
  constructor(public name: string, message: string) {
    super(message);
  }
}

export const isError = (data: any): data is Error =>
  !!data.stack && !!data.name;
