import { HttpHeaders, HttpMethod } from '@marblejs/core';
import { Logger, ServerApp, ServerProxy, ServerProxyRequest, ServerProxyResponse } from '../';

export interface MyRequest {
  headers?: HttpHeaders;
  method: HttpMethod;
  path: string;
  body?: string;
}

export interface MyResponse {
  headers: HttpHeaders;
  body?: string;
  code: number;
}

export class MyProxy extends ServerProxy<MyRequest, MyResponse> {

  constructor(app: ServerApp, logger: Logger) {
    super(app);
    this.log = logger;
  }

  normalizeError(error: Error): MyResponse {
    return {
      code: 502,
      body: error.message,
      headers: {},
    };
  }

  normalizeRequest(proxyRequest: MyRequest): ServerProxyRequest {
    const {
      body,
      headers,
      method,
      path,
    } = proxyRequest;
    return {
      headers,
      // Convert body to buffer
      body: body !== undefined ? Buffer.from(body) : undefined,
      method,
      path
    };
  }

  normalizeResponse(serverProxyResponse: ServerProxyResponse): MyResponse {
    const {
      headers,
      body,
      statusCode,
    } = serverProxyResponse;

    return {
      // Convert multi-value headers from Record<string, string[]>
      headers: Object.keys(headers).reduce((result, key) => {
        result[key] = headers[key][0];
        return headers;
      }, {}),
      // Convert body from Buffer to string
      body: body && body.toString(),
      code: statusCode,
    };
  }
}

export const sleep = (timeout: number) => new Promise(resolve => {
  setTimeout(() => resolve(), timeout);
});

export const loggerMock = () => {
  const logs: string[] = [];
  return {
    logs,
    message: (index: number) => index < 0 ? logs[logs.length + index] : logs[index],
    log: (message: string) => logs.push(message),
  };
};
