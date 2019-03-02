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
  run: (predicate?: boolean) => https.Server | http.Server;
  server: https.Server | http.Server;
  info: ServerInfo;
}

export interface ServerOptions {
  httpsOptions?: https.ServerOptions;
}

export interface ServerInfo {
  routing: RoutingItem[];
}
