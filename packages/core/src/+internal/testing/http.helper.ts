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
