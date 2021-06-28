import { createContextToken, createReader } from '@marblejs/core';
import { HttpServer } from '../../http.interface';
import { HttpRequestBus } from './httpRequestBus.reader';

export type HttpServerClient = ReturnType<typeof HttpRequestBus>;

export const HttpServerClientToken = createContextToken<HttpServer>('HttpServerClient');

export const HttpServerClient = (httpServer: HttpServer) => createReader(_ => httpServer);
