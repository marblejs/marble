import { WriteStream } from 'fs';
import { HttpResponse, HttpRequest } from '@marblejs/core';

export type LoggerCtx = {
  req: HttpRequest;
  res: HttpResponse;
};

export interface LoggerOptions {
  silent?: boolean;
  stream?: WriteStream;
  filter?: (res: HttpResponse, req: HttpRequest) => boolean;
}

export interface LogParams {
  timestamp?: string;
  method: string;
  url: string;
  statusCode: string;
  time: string;
}
