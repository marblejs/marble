import * as http from 'http';
import * as https from 'https';
import { Observable } from 'rxjs';
import { HttpEffectResponse } from './effects/http.effects.interface';

export type HttpRequestMetadata = Record<string, any>;

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
  meta?: HttpRequestMetadata;
  response: HttpResponse;
  [key: string]: any;
}

export interface RouteParameters {
  [key: string]: any;
}

export interface QueryParameters {
  [key: string]: any;
}

export interface HttpResponse extends http.ServerResponse {
  /**
   * Send HTTP response
   *
   * @param response `HttpEffectResponse`
   * @returns `Observable<boolean>` (indicates whether the response was sent or not)
   * @since 1.0.0
   */
  send: (response: HttpEffectResponse) => Observable<boolean>;
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

export type HttpServer = https.Server | http.Server;

export type HttpMethod = keyof typeof HttpMethodType;

export enum HttpStatus {
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NONAUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,
  MULTIPLE_CHOICES = 300,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PROXY_AUTHENTICATION_REQUIRED = 407,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  PAYLOAD_TOO_LARGE = 413,
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  IM_A_TEAPOT = 418,
  UNPROCESSABLE_ENTITY = 422,
  FAILED_DEPENDENCY = 424,
  TOO_EARLY = 425,
  UPGRADE_REQUIRED = 426,
  PRECONDITION_REQUIRED = 428,
  TOO_MANY_REQUESTS = 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
  UNAVAILABLE_FOR_LEGAL_REASONS = 451,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
  NETWORK_AUTHENTICATION_REQUIRED = 511,
}
