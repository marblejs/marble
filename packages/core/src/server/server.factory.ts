import * as http from 'http';
import { takeWhile } from 'rxjs/operators';
import { httpListener } from '../listener/http.listener';
import { isCloseEvent } from './server.event';
import { subscribeServerEvents } from './server.event.subscriber';
import { InjectionDependencies } from './server.injector';
import { ServerEffect } from '../effects/effects.interface';

export interface CreateServerConfig {
  port?: number;
  hostname?: string;
  httpListener: ReturnType<typeof httpListener>;
  event$?: ServerEffect;
  dependencies?: InjectionDependencies;
}

export const createServer = (config: CreateServerConfig) => {
  const { httpListener, event$, port, hostname, dependencies } = config;
  const { injector, routing } = httpListener.config;

  const eventsSubscriber = subscribeServerEvents(port, hostname);
  const server = http.createServer(httpListener);
  const serverEvent$ = eventsSubscriber(server).pipe(takeWhile(e => !isCloseEvent(e)));

  if (dependencies) {
    injector.registerAll(dependencies)(server);
  }

  if (event$) {
    event$(serverEvent$, server, injector.get).subscribe();
  }

  return {
    server,
    info: { routing },
  };
};
