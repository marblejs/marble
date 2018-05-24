import * as http from 'http';

export interface HttpRequest extends http.IncomingMessage {
  body?: any;
  matchers?: string[];
  params?: RouteParameters;
  [key: string]: any;
}

export type RouteParameters = Record<string, string | number>;
export type QueryParameters = Record<string, string | number | object>;

export interface HttpRoute {
  url: string;
  params?: RouteParameters;
  query?: QueryParameters;
}

export interface HttpResponse extends http.ServerResponse {}

export type HttpHeaders = Record<string, string>;

export type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'GET' | 'HEAD' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE';

export type Http = {
  req: HttpRequest;
  res: HttpResponse;
};

export enum HttpStatus {
  OK                    = 200,
  CREATED               = 201,
  ACCEPTED              = 202,
  NO_CONTENT            = 204,
  NOT_MODIFIED          = 304,
  BAD_REQUEST           = 400,
  UNAUTHORIZED          = 401,
  FORBIDDEN             = 403,
  NOT_FOUND             = 404,
  METHOD_NOT_ALLOWED    = 405,
  NOT_ACCEPTABLE        = 406,
  REQUEST_TIMEOUT       = 408,
  CONFLICT              = 409,
  GONE                  = 410,
  FAILED_DEPENDENCY     = 424,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED       = 501,
  BAD_GATEWAY           = 502,
  SERVICE_UNAVAILABLE   = 503,
  GATEWAY_TIMEOUT       = 504,
}
