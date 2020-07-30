import * as http from 'http';
import { EventEmitter } from 'events';
import { delay, tap, mapTo } from 'rxjs/operators';
import {
  HttpRequest,
  HttpResponse,
  HttpHeaders,
  HttpMethod,
  RouteParameters,
  QueryParameters,
  HttpServer,
} from '../../http/http.interface';
import { createContext, lookup, registerAll, bindTo } from '../../context/context';
import { createEffectContext } from '../../effects/effectsContext.factory';
import { ServerIO } from '../../listener/listener.interface';
import { LoggerToken, mockLogger } from '../../logger';
import { factorizeRegExpWithParams } from '../../http/router/http.router.params.factory';
import { HttpEffect } from '../../http/effects/http.effects.interface';
import { RoutingItem } from '../../http/router/http.router.interface';
import { HttpRequestBusToken, HttpRequestBus } from '../../http/server/internal-dependencies/httpRequestBus.reader';
import { HttpServerClientToken } from '../../http/server/http.server.tokens';

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
    bindTo(LoggerToken)(mockLogger),
    bindTo(HttpRequestBusToken)(HttpRequestBus),
    bindTo(HttpServerClientToken)(() => http.createServer()),
  ];
  const context = registerAll(dependencies)(createContext());
  const client = http.createServer();
  return createEffectContext({ ask: lookup(context), client });
};

export const createTestRoute = (opts?: { throwError?: boolean; delay?: number; method?: HttpMethod }) => {
  const method = opts?.method ?? 'GET';
  const routeDelay = opts?.delay ?? 0;

  const req = createHttpRequest(({ url: `/delay_${routeDelay}`, method }));
  const path = factorizeRegExpWithParams(`/delay_${routeDelay}`);

  const effect: HttpEffect = req$ =>
    req$.pipe(
      delay(routeDelay),
      tap(() => { if (opts?.throwError) throw new Error(); }),
      mapTo({ body: `delay_${routeDelay}` }),
    );

  const item: RoutingItem = {
    regExp: path.regExp,
    path: path.path,
    methods: { [method]: { effect, middlewares: [] } },
  };

  return { req, path, effect, item };
};

/**
 * @deprecated
 */
export const createHttpServerTestBed = (server: Promise<ServerIO<HttpServer>>) => {
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
