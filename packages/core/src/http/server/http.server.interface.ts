import * as https from 'https';
import { HttpServerEffect } from '../effects/http.effects.interface';
import { BoundDependency } from '../../context/context.factory';
import { ListenerServer } from '../../listener/listener.interface';
import { HttpServer } from '../http.interface';
import { httpListener } from './http.server.listener';

export interface CreateServerConfig {
  port?: number;
  hostname?: string;
  httpListener: ReturnType<typeof httpListener>;
  event$?: HttpServerEffect;
  options?: ServerOptions;
  dependencies?: BoundDependency<any>[];
}

export interface Server extends ListenerServer<HttpServer> {}

export interface ServerOptions {
  httpsOptions?: https.ServerOptions;
}
