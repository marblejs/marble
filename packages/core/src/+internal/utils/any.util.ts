export const isNonNullable = <T>(value: T): value is NonNullable<T>  =>
  value !== undefined && value !== null;
