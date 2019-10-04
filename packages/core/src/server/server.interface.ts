import * as http from 'http';
import * as https from 'https';
import { httpListener } from '../listener/http.listener';
import { HttpServerEffect } from '../effects/http-effects.interface';
import { BoundDependency } from '../context/context.factory';
import { RoutingItem } from '../router/router.interface';

export interface CreateServerConfig {
  port?: number;
  hostname?: string;
  httpListener: ReturnType<typeof httpListener>;
  event$?: HttpServerEffect;
  options?: ServerOptions;
  dependencies?: BoundDependency<any>[];
}

export interface Server {
  (): https.Server | http.Server;
  config: ServerConfig;
}

export interface ServerOptions {
  httpsOptions?: https.ServerOptions;
}

export interface ServerConfig {
  server: https.Server | http.Server;
  routing: RoutingItem[];
}
