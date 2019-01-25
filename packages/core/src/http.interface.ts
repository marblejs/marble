import * as http from 'http';
import { Observable } from 'rxjs';
import { HttpEffectResponse } from './effects/effects.interface';

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
  send: (response: HttpEffectResponse) => Observable<never>;
}

export interface HttpHeaders extends http.OutgoingHttpHeaders {}

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
