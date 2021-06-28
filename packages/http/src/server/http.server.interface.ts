import * as https from 'https';
import { ServerConfig } from '@marblejs/core';
import { HttpServerEffect } from '../effects/http.effects.interface';
import { httpListener } from './http.server.listener';

export const DEFAULT_HOSTNAME = '127.0.0.1';

type HttpListenerFn = ReturnType<typeof httpListener>;

export interface CreateServerConfig extends ServerConfig<HttpServerEffect, HttpListenerFn> {
  port?: number;
  hostname?: string;
  options?: ServerOptions;
}

export interface ServerOptions {
  httpsOptions?: https.ServerOptions;
}
