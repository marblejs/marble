import { HttpRequest } from '@marblejs/http';

export type RequestBodyParser = (reqOrContentType: HttpRequest | string) =>
  (body: Buffer) => Buffer | Record<string, unknown> | Array<any> | string | undefined;
