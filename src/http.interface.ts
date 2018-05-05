import * as http from 'http';

export interface HttpRequest extends http.IncomingMessage {
  body?: any;
  [key: string]: any;
}

export interface HttpResponse extends http.ServerResponse {}

export type HttpHeaders = Record<string, string>;

export type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'GET' | 'HEAD' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE';

export enum HttpStatus {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  FAILED_DEPENDENCY = 424,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export type Http = {
  req: HttpRequest,
  res: HttpResponse,
};
