import * as https from 'https';
import { HttpServerEffect } from '../effects/http.effects.interface';
import { BoundDependency } from '../../context/context.factory';
import { httpListener } from './http.server.listener';

export const DEFAULT_HOSTNAME = '127.0.0.1';

export interface CreateServerConfig {
  port?: number;
  hostname?: string;
  listener: ReturnType<typeof httpListener>;
  event$?: HttpServerEffect;
  options?: ServerOptions;
  dependencies?: BoundDependency<any>[];
}

export interface ServerOptions {
  httpsOptions?: https.ServerOptions;
}
