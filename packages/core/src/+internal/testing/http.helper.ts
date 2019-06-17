import * as http from 'http';
import {
  HttpRequest,
  HttpResponse,
  HttpHeaders,
  HttpMethod,
  RouteParameters,
  QueryParameters,
} from '../../http.interface';
import { EventEmitter } from 'events';

interface HttpRequestMockParams {
  url?: string;
  body?: any;
  params?: RouteParameters;
  query?: QueryParameters;
  headers?: HttpHeaders;
  method?: HttpMethod;
  meta?: Record<string, any>;
  [key: string]: any;
}

interface HttpResponseMockParams {
  statusCode?: number;
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
  },
  data,
) as HttpRequest;

export const createHttpResponse = (data: HttpResponseMockParams = {}) =>
  new class extends EventEmitter {
    statusCode = data.statusCode;
  } as any as HttpResponse;

export const mockHttpServer = (mocks: HttpServerMocks = {}) =>
  jest.spyOn(http, 'createServer').mockImplementation(jest.fn(() => ({
    listen: mocks.listen || jest.fn(),
    close: mocks.close || jest.fn(callback => callback()),
    on: mocks.on || jest.fn(),
  })));
