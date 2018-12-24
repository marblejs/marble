import * as http from 'http';
import { HttpRequest, HttpHeaders, RouteParameters, QueryParameters, HttpResponse } from '../../http.interface';

interface HttpRequestMockParams {
  url: string;
  body?: any;
  params?: RouteParameters;
  query?: QueryParameters;
  headers?: HttpHeaders;
  [key: string]: any;
}

interface HttpResponseMockParams {
  statusCode?: number;
  [key: string]: any;
}

export interface HttpServerMocks {
  listen?: jest.Mock;
  on?: jest.Mock;
}

export const createHttpRequest = (data: HttpRequestMockParams = { url: '/' }) => ({
  ...data,
  url: data.url,
  body: data.body,
  params: data.params || {},
  query: data.query || {},
  headers: data.headers || {},
}) as HttpRequest;

export const createHttpResponse = (data: HttpResponseMockParams = {}) => ({
  ...data,
  statusCode: data.statusCode,
}) as HttpResponse;

export const mockHttpServer = (mocks: HttpServerMocks = {}) =>
  jest.spyOn(http, 'createServer').mockImplementation(jest.fn(() => ({
    listen: mocks.listen || jest.fn(),
    on: mocks.on || jest.fn(),
  })));
