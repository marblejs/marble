import { HttpRequest } from '@marblejs/core';

export type RequestBodyParser = (reqOrContentType: HttpRequest | string) =>
  (body: Buffer) => Buffer | object | string | undefined;
