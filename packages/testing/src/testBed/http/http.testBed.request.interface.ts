import { HttpMethod, HttpHeaders } from '@marblejs/http';
import { withHeaders, withBody, withPath } from './http.testBed.request';
import { HttpTestBedResponse } from './http.testBed.response.interface';

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
  <T extends HttpMethod>(method: T): HttpTestBedRequest<T>;
  withHeaders: typeof withHeaders;
  withBody: typeof withBody;
  withPath: typeof withPath;
  send: <T extends HttpMethod>(req: HttpTestBedRequest<T>) => Promise<HttpTestBedResponse>;
}
