import * as http from 'http';
import { Observable } from 'rxjs';
import { EffectHttpResponse } from './effects/effects.interface';

export interface HttpRequest<
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown,
> extends http.IncomingMessage {
  url: string;
  method: HttpMethod;
  body: TBody;
  params: TParams;
  query: TQuery;
  [key: string]: any;
}

export interface RouteParameters {
  [key: string]: any;
}

export interface QueryParameters {
  [key: string]: any;
}

export interface HttpResponse extends http.ServerResponse {
  send: (response: EffectHttpResponse) => Observable<never>;
}

export interface HttpHeaders extends Record<string, string> {}

export enum HttpMethodType {
  POST,
  PUT,
  PATCH,
  GET,
  HEAD,
  DELETE,
  CONNECT,
  OPTIONS,
  TRACE,
  '*',
}

export type HttpMethod = keyof typeof HttpMethodType;

export type Http = {
  req: HttpRequest;
  res: HttpResponse;
};

export enum HttpStatus {
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  NOT_MODIFIED = 304,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  FAILED_DEPENDENCY = 424,
  UPGRADE_REQUIRED = 426,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
}

export enum HttpEventType {
  CONNECT = 'connect',
  CONNECTION = 'connection',
  CLIENT_ERROR = 'clientError',
  CLOSE = 'close',
  CHECK_CONTINUE = 'checkContinue',
  CHECK_EXPECTATION = 'checkExpectation',
  ERROR = 'error',
  REQUEST = 'request',
  UPGRADE = 'upgrade',
  LISTEN = 'listen',
}

export type HttpEvent<T extends HttpEventType, U> = {
  type: T;
  data: U;
};

export type HttpEventListen = HttpEvent<HttpEventType.LISTEN, [number, string]>;
export type HttpEventUpgrade = HttpEvent<HttpEventType.UPGRADE, [http.IncomingMessage, any, any]>;
export type HttpEventRequest = HttpEvent<HttpEventType.REQUEST, any>;
export type HttpEventError = HttpEvent<HttpEventType.ERROR, any>;
export type HttpEventCheckExpectation = HttpEvent<HttpEventType.CHECK_EXPECTATION, any>;
export type HttpEventCheckContinue = HttpEvent<HttpEventType.CHECK_CONTINUE, any>;
export type HttpEventClose = HttpEvent<HttpEventType.CLOSE, any>;
export type HttpEventConnection = HttpEvent<HttpEventType.CONNECTION, any>;
export type HttpEventConnect = HttpEvent<HttpEventType.CONNECT, any>;
export type HttpEventClientError = HttpEvent<HttpEventType.CLIENT_ERROR, any>;

export type HttpAllEvents =
  | HttpEventListen
  | HttpEventUpgrade
  | HttpEventRequest
  | HttpEventError
  | HttpEventCheckExpectation
  | HttpEventCheckContinue
  | HttpEventClose
  | HttpEventConnection
  | HttpEventConnect
  | HttpEventClientError
  ;
