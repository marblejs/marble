export type ContextToken<T = any> = new() => Token<T>;

export class Token<T = any> {
  surrogate!: T;
}

export const createContextToken = <T>() =>
  class extends Token<T> {};
