import { HttpHeaders, HttpMethod } from '@marblejs/core';
import { defaultParser, RequestBodyParser } from '@marblejs/middleware-body';
import { bodyFactory } from '@marblejs/core/dist/response/responseBody.factory';

export interface TestRequest {
  method: HttpMethod;
  path: string;
  host?: string;
  protocol?: string;
  headers: HttpHeaders;
  body?: any;
}

export interface TestResponse {
  statusCode: number;
  statusMessage?: string;
  body: any;
  headers: Record<string, string[]>;
}

export interface TestProxyOptions {
  bodyFactory: (headers: HttpHeaders) => (body: any) => Buffer;
  bodyParser: RequestBodyParser;
}

export const defaultTestProxyOptions: TestProxyOptions = {
  bodyFactory: bodyFactory,
  bodyParser: defaultParser,
};
