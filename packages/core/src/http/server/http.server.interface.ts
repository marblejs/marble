import * as http from 'http';
import * as https from 'https';
import { HttpServerEffect } from '../effects/http.effects.interface';
import { BoundDependency, Context } from '../../context/context.factory';
import { httpListener } from './http.server.listener';

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
