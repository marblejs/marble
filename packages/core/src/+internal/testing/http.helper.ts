import {
  HttpRequest,
  HttpResponse,
  HttpHeaders,
  HttpMethod,
  RouteParameters,
  QueryParameters,
} from '../../http.interface';
import * as http from 'http';
import { EventEmitter } from 'events';
import { createContext, lookup } from '../../context/context.factory';
import { createEffectContext } from '../../effects/effectsContext.factory';

interface HttpRequestMockParams {
  url?: string;
  body?: any;
  params?: RouteParameters;
  query?: QueryParameters;
  headers?: HttpHeaders;
  method?: HttpMethod;
  meta?: Record<string, any>;
  response?: HttpResponse;
  [key: string]: any;
}

interface HttpResponseMockParams {
  statusCode?: number;
  finished?: boolean;
  [key: string]: any;
}

export interface HttpServerMocks {
  listen?: jest.Mock;
  close?: jest.Mock;
  on?: jest.Mock;
}

export const createHttpRequest = (data?: HttpRequestMockParams) => Object.assign(
  {},
  {
    url: '/',
    method: 'GET',
    headers: {},
    query: {},
    params: {},
    meta: {},
    response: createHttpResponse() as HttpResponse,
  },
  data,
) as HttpRequest;

export const createHttpResponse = (data: HttpResponseMockParams = {}) =>
  new class extends EventEmitter {
    statusCode = data.statusCode;
    writeHead = jest.fn();
    setHeader = jest.fn();
    getHeader = jest.fn();
    end = jest.fn();
  } as any as HttpResponse;

export const createMockEffectContext = () => {
  const context = createContext();
  const client = http.createServer();
  return createEffectContext({ ask: lookup(context), client });
};
