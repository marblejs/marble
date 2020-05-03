import { HttpMethod, HttpHeaders } from '@marblejs/core';
import { createRequest, withHeaders, withBody, withPath } from './http.testBed.request';

export interface HttpTestBedRequest<T extends HttpMethod> extends Readonly<{
  host: string;
  port: number;
  protocol: string;
  headers: HttpHeaders;
  method: T;
  path: string;
  body?: any;
}> {}

export interface WithBodyApplied<T> {
  readonly body: T;
}

export interface HttpTestBedRequestBuilder {
  req: ReturnType<typeof createRequest>;
  withHeaders: typeof withHeaders;
  withBody: typeof withBody;
  withPath: typeof withPath;
}
