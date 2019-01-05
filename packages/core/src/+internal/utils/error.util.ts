export class ExtendableError extends Error {
  constructor(public name: string, message: string) {
    super(message);
  }
}
