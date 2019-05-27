import { HttpResponse, HttpRequest } from '@marblejs/core';

export type WritableLike = {
  write: (chunk: any) => void;
}

export type LoggerCtx = {
  req: HttpRequest;
  res: HttpResponse;
};

export interface LoggerOptions {
  silent?: boolean;
  stream?: WritableLike;
  filter?: (res: HttpResponse, req: HttpRequest) => boolean;
}

export interface LogParams {
  timestamp?: string;
  method: string;
  url: string;
  statusCode: string;
  time: string;
}
