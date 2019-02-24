import * as http from 'http';
import * as https from 'https';
import { Subject } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { httpListener } from '../listener/http.listener';
import { isCloseEvent, ServerEvent, AllServerEvents } from './server.event';
import { subscribeServerEvents } from './server.event.subscriber';
import { createContext, BoundDependency, lookup, registerAll } from '../context/context.factory';
import { HttpServerEffect } from '../effects/http-effects.interface';
import { createEffectMetadata } from '../effects/effectsMetadata.factory';
import { AddressInfo } from 'net';

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

const DEFAULT_HOSTNAME = '127.0.0.1';

export const createServer = (config: CreateServerConfig) => {
  const { httpListener, event$, port, hostname, dependencies = [], options = {} } = config;
  const serverEvent$ = new Subject<AllServerEvents>();

  const context = registerAll(dependencies)(createContext());
  const httpListenerWithContext = httpListener.run(context);
  const server = (options.httpsOptions
    ? https.createServer(options.httpsOptions, httpListenerWithContext)
    : http.createServer(httpListenerWithContext)
  ).listen(port, hostname, () => {
    const serverAddressInfo = server.address() as AddressInfo;
    serverEvent$.next(
      ServerEvent.listen(serverAddressInfo.port, hostname || DEFAULT_HOSTNAME)
    );
  });

  subscribeServerEvents(serverEvent$)(server);

  if (event$) {
    const metadata = createEffectMetadata({ ask: lookup(context) });
    event$(serverEvent$.pipe(takeWhile(e => !isCloseEvent(e))), server, metadata).subscribe();
  }

  return {
    server,
    info: {
      routing: httpListenerWithContext.config.routing,
    },
  };
};
