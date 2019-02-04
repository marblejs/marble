import { HttpRequest } from '@marblejs/core';

export type BodyParser = (req: HttpRequest) => (body: Buffer) => Buffer | object | string | undefined;
