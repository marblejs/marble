import { HttpRequest, HttpHeaders, RouteParameters, QueryParameters } from '../../http.interface';

interface HttpRequestMockParams {
  url: string;
  body?: any;
  params?: RouteParameters;
  query?: QueryParameters;
  headers?: HttpHeaders;
  [key: string]: any;
}

export const createHttpRequest = (data: HttpRequestMockParams) => ({
  ...data,
  url: data.url,
  body: data.body,
  params: data.params || {},
  query: data.query || {},
  headers: data.headers || {},
}) as HttpRequest;
