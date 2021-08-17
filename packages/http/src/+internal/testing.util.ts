import * as http from 'http';
import { EventEmitter } from 'events';
import { of } from 'rxjs';
import { delay, tap, mapTo } from 'rxjs/operators';
import {
  createContext,
  createEffectContext,
  lookup,
  registerAll,
  bindTo,
  LoggerToken,
  mockLogger,
} from '@marblejs/core';
import {
  HttpRequest,
  HttpResponse,
  HttpHeaders,
  HttpMethod,
  RouteParameters,
  QueryParameters,
} from '../http.interface';
import { factorizeRegExpWithParams } from '../router/http.router.params.factory';
import { HttpEffect } from '../effects/http.effects.interface';
import { RoutingItem } from '../router/http.router.interface';
import { HttpRequestBusToken, HttpRequestBus } from '../server/internal-dependencies/httpRequestBus.reader';
import { HttpServerClientToken, HttpServerClient } from '../server/internal-dependencies/httpServerClient.reader';

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
    send = jest.fn(() => of(true));
  } as any as HttpResponse;

export const createMockEffectContext = () => {
  const dependencies = [
    bindTo(LoggerToken)(mockLogger),
    bindTo(HttpRequestBusToken)(HttpRequestBus),
    bindTo(HttpServerClientToken)(HttpServerClient(http.createServer())),
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
