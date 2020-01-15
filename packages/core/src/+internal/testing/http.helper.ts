import * as http from 'http';
import { EventEmitter } from 'events';
import { Subject } from 'rxjs';
import {
  HttpRequest,
  HttpResponse,
  HttpHeaders,
  HttpMethod,
  RouteParameters,
  QueryParameters,
  HttpServer,
} from '../../http/http.interface';
import { createContext, lookup, registerAll, bindTo } from '../../context/context.factory';
import { createEffectContext } from '../../effects/effectsContext.factory';
import { Server } from '../../http/server/http.server.interface';
import { HttpRequestBusToken, HttpServerClientToken } from '../../http/server/http.server.tokens';

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
    send = jest.fn();
  } as any as HttpResponse;

export const createMockEffectContext = () => {
  const dependencies = [
    bindTo(HttpRequestBusToken)(() => new Subject<HttpRequest>()),
    bindTo(HttpServerClientToken)(() => http.createServer()),
  ];
  const context = registerAll(dependencies)(createContext());
  const client = http.createServer();
  return createEffectContext({ ask: lookup(context), client });
};

export const createHttpServerTestBed = (server: Promise<Server>) => {
  let httpServer: HttpServer;

  const getInstance = () => httpServer;

  beforeAll(async () => {
    const app = await server;
    httpServer = await app();
  });

  afterAll(done => {
    httpServer.close(done);
  });

  return {
    getInstance,
  };
};

export type HttpServerTestBed = ReturnType<typeof createHttpServerTestBed>;
