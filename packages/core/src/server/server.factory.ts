import * as http from 'http';
import * as https from 'https';
import { takeWhile } from 'rxjs/operators';
import { httpListener } from '../listener/http.listener';
import { isCloseEvent } from './server.event';
import { subscribeServerEvents } from './server.event.subscriber';
import { ContextDependencies } from '../context/context.factory';
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
  dependencies?: ContextDependencies;
}

export const createServer = (config: CreateServerConfig) => {
  const { httpListener, event$, port, hostname, dependencies, options = {} } = config;
  const { context, routing } = httpListener.config;

  const eventsSubscriber = subscribeServerEvents(port, hostname);
  const server = options.httpsOptions
    ? https.createServer(options.httpsOptions, httpListener)
    : http.createServer(httpListener);
  const serverEvent$ = eventsSubscriber(server).pipe(takeWhile(e => !isCloseEvent(e)));

  context.register(httpServerToken, () => server);

  if (dependencies) {
    context.registerAll(dependencies);
  }

  if (event$) {
    const metadata = createEffectMetadata({ ask: context.ask });
    event$(serverEvent$, server, metadata).subscribe();
  }

  return {
    server,
    info: { routing },
  };
};
