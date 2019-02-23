import * as http from 'http';
import * as https from 'https';
import { pipe } from 'fp-ts/lib/function';
import { takeWhile } from 'rxjs/operators';
import { httpListener } from '../listener/http.listener';
import { isCloseEvent } from './server.event';
import { subscribeServerEvents } from './server.event.subscriber';
import { createContext, BoundDependency, lookup, bindTo, register, registerAll } from '../context/context.factory';
import { HttpServerEffect } from '../effects/http-effects.interface';
import { httpServerToken } from './server.token';
import { createEffectMetadata } from '../effects/effectsMetadata.factory';

export interface ServerOptions {
  httpsOptions?: https.ServerOptions;
}

export interface CreateServerConfig {
  port?: number;
  hostname?: string;
  httpListener: ReturnType<typeof httpListener>;
  event$?: HttpServerEffect;
  options?: ServerOptions;
  dependencies?: BoundDependency<any>[];
}

export const createServer = (config: CreateServerConfig) => {
  const { httpListener, event$, port, hostname, dependencies = [], options = {} } = config;
  const boundHttpServer = bindTo(httpServerToken)(httpListener);
  const context = pipe(
    register(boundHttpServer),
    registerAll(dependencies),
  )(createContext());

  const eventsSubscriber = subscribeServerEvents(port, hostname);
  const httpServer = httpListener.run(context);
  const server = options.httpsOptions
    ? https.createServer(options.httpsOptions, httpServer)
    : http.createServer(httpServer);
  const serverEvent$ = eventsSubscriber(server).pipe(takeWhile(e => !isCloseEvent(e)));

  if (event$) {
    const metadata = createEffectMetadata({ ask: lookup(context) });
    event$(serverEvent$, server, metadata).subscribe();
  }

  return {
    server,
    info: {
      routing: httpServer.config.routing,
    },
  };
};
