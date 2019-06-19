import { HttpRequest } from '@marblejs/core';
import { getContentType } from '@marblejs/core/dist/+internal/http';

const isProperMethod = (req: HttpRequest): boolean =>
  ['POST', 'PUT'].includes(req.method);

const isMultipart = (req: HttpRequest): boolean =>
  getContentType(req.headers).includes('multipart/');

export const shouldParseMultipart = (req: HttpRequest) =>
  isProperMethod(req) && isMultipart(req);
