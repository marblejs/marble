import * as http from 'http';
import { Observable } from 'rxjs';
import { EffectResponse } from './effects/effects.interface';

export interface HttpRequest<
  TBody = any,
  TParams = any,
  TQuery = any,
> extends http.IncomingMessage {
  url: string;
  method: HttpMethod;
  body?: TBody;
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
  send: (effect: EffectResponse) => Observable<never>;
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
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}
