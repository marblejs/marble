import * as http from 'http';

export interface HttpRequest extends http.IncomingMessage {
  [key: string]: any;
}

export interface HttpResponse extends http.ServerResponse {}

export type HttpHeaders = Record<string, string>;

export type Http = {
  req: HttpRequest,
  res: HttpResponse,
};
