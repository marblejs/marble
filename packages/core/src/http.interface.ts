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

export enum EventType {
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

export type MarbleEvent<T extends EventType = EventType, U = any> = {
  type: T;
  data?: U;
};

type EventListen = MarbleEvent<EventType.LISTEN, [number, string]>;
type EventUpgrade = MarbleEvent<EventType.UPGRADE, [http.IncomingMessage, any, any]>;
type EventRequest = MarbleEvent<EventType.REQUEST, any>;
type EventError = MarbleEvent<EventType.ERROR, any>;
type EventClose = MarbleEvent<EventType.CLOSE, any>;
type EventConnect = MarbleEvent<EventType.CONNECT, any>;
type EventConnection = MarbleEvent<EventType.CONNECTION, any>;
type EventClientError = MarbleEvent<EventType.CLIENT_ERROR, any>;
type EventCheckContinue = MarbleEvent<EventType.CHECK_CONTINUE, any>;
type EventCheckExpectation = MarbleEvent<EventType.CHECK_EXPECTATION, any>;

export const Event = {
  CONNECT: { type: EventType.CONNECT } as EventConnect,
  CONNECTION: { type: EventType.CONNECTION } as EventConnection,
  CLIENT_ERROR: { type: EventType.CLIENT_ERROR } as EventClientError,
  CLOSE: { type: EventType.CLOSE } as EventClose,
  CHECK_CONTINUE: { type: EventType.CHECK_CONTINUE } as EventCheckContinue,
  CHECK_EXPECTATION: { type: EventType.CHECK_EXPECTATION } as EventCheckExpectation,
  ERROR: { type: EventType.ERROR } as EventError,
  REQUEST: { type: EventType.REQUEST } as EventRequest,
  UPGRADE:  { type: EventType.UPGRADE } as EventUpgrade,
  LISTEN: { type: EventType.LISTEN } as EventListen,
};
