import { HttpRequest } from '@marblejs/core';

export type WritableLike = {
  write: (chunk: any) => void;
}

export interface LoggerOptions {
  silent?: boolean;
  filter?: (req: HttpRequest) => boolean;
}

export interface LogParams {
  method: string;
  url: string;
  statusCode: string;
  time: string;
}
