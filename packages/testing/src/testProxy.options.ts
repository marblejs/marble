import { binaryMimeTypes, getHeaderByKey, ServerProxyResponse } from '@marblejs/proxy';
import { HttpHeaders, HttpMethod } from '@marblejs/core';

export interface TestRequest {
  method: HttpMethod;
  path: string;
  host?: string;
  protocol?: string;
  headers: HttpHeaders;
  body?: any;
}

export interface TestResponse {
  statusCode: number;
  statusMessage?: string;
  body: any;
  headers: Record<string, string[]>;
}

export type BodyParser = (response: ServerProxyResponse) => any;

export interface TestProxyOptions {
  bodyParser: BodyParser;
}

export const defaultBodyParser: BodyParser = response => {
  const { body: rawBody, headers } = response;
  if (!rawBody) {
    return rawBody;
  }
  const contentType = getHeaderByKey(headers, 'Content-Type') || '';
  const isBinaryType = contentType.split(';')
    .find(type => binaryMimeTypes.includes(type));
  if (isBinaryType) {
    return rawBody;
  } else {
    const body = rawBody.toString();
    if (body && contentType.match(/application\/(?:.+\+)?json/)) {
      return JSON.parse(body);
    }
    return body;
  }
};

export const defaultTestProxyOptions: TestProxyOptions = {
  bodyParser: defaultBodyParser,
};
