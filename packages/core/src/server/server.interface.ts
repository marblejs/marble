import * as http from 'http';
import * as https from 'https';
import { httpListener } from '../listener/http.listener';
import { HttpServerEffect } from '../effects/http-effects.interface';
import { BoundDependency, Context } from '../context/context.factory';
import { RoutingItem } from '../router/router.interface';
import { HttpServer } from '../http.interface';

export interface CreateServerConfig {
  port?: number;
  hostname?: string;
  httpListener: ReturnType<typeof httpListener>;
  event$?: HttpServerEffect;
  options?: ServerOptions;
  dependencies?: BoundDependency<any>[];
}

export interface Server {
  (): Promise<https.Server | http.Server>;
  context: Context;
}

export interface ServerOptions {
  httpsOptions?: https.ServerOptions;
}

export interface ServerConfig {
  server: HttpServer;
  routing: RoutingItem[];
}
