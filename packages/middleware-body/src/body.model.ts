import { HttpRequest } from '@marblejs/core';

export type RequestBodyParser = (req: HttpRequest) => (body: Buffer) => Buffer | object | string | undefined;
