import * as http from 'http';
import * as https from 'https';
import { Subject } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { isCloseEvent, AllServerEvents } from './server.event';
import { subscribeServerEvents } from './server.event.subscriber';
import { createContext, lookup, registerAll, bindTo } from '../context/context.factory';
import { createEffectMetadata } from '../effects/effectsMetadata.factory';
import { CreateServerConfig, Server } from './server.interface';
import { serverEvent$ } from './server.tokens';

const DEFAULT_HOSTNAME = '127.0.0.1';

export const createServer = (config: CreateServerConfig): Server => {
  const { httpListener, event$, port, hostname, dependencies = [], options = {} } = config;
  const serverEventSubject = new Subject<AllServerEvents>();
  const boundServerEvent$ = bindTo(serverEvent$)(() => serverEventSubject.asObservable());
  const context = registerAll([ boundServerEvent$, ...dependencies ])(createContext());

  const httpListenerWithContext = httpListener(context);
  const server = options.httpsOptions
    ? https.createServer(options.httpsOptions, httpListenerWithContext)
    : http.createServer(httpListenerWithContext);

  subscribeServerEvents(hostname || DEFAULT_HOSTNAME)(serverEventSubject)(server);

  if (event$) {
    const metadata = createEffectMetadata({ ask: lookup(context), client: server });
    event$(serverEventSubject.pipe(takeWhile(e => !isCloseEvent(e))), metadata).subscribe();
  }

  const listen = () => new Promise<https.Server | http.Server>((resolve, reject) => {
    const runningServer = server.listen(port, hostname);
    runningServer.once('listening', () => resolve(runningServer));
    runningServer.once('error', error => reject(error));
  });

  listen.config = {
    ...httpListenerWithContext.config,
    server,
  };

  return listen;
};
