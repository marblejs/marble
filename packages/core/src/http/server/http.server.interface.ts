import * as https from 'https';
import { HttpServerEffect } from '../effects/http.effects.interface';
import { BoundDependency } from '../../context/context.factory';
import { httpListener } from './http.server.listener';

export interface CreateServerConfig {
  port?: number;
  hostname?: string;
  httpListener: ReturnType<typeof httpListener>;
  event$?: HttpServerEffect;
  options?: ServerOptions;
  dependencies?: BoundDependency<any>[];
}

export interface ServerOptions {
  httpsOptions?: https.ServerOptions;
}
