export type PromiseArg<T> = T extends PromiseLike<infer U> ? U : T;
