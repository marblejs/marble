import { WriteStream } from 'fs';
import { HttpResponse } from '@marblejs/core';

export interface LoggerOptions {
  silent?: boolean;
  stream?: WriteStream;
  filter?: (req: HttpResponse) => boolean;
}

export interface LogParams {
  timestamp?: string;
  method: string;
  url: string;
  statusCode: string;
  time: string;
}
