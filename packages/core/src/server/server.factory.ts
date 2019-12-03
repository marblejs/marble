import * as http from 'http';
import * as https from 'https';
import { subscribeServerEvents } from './server.event.subscriber';
import { createContext, lookup, registerAll, bindTo } from '../context/context.factory';
import { createEffectContext } from '../effects/effectsContext.factory';
import { CreateServerConfig, Server } from './server.interface';
import {ServerClientToken, ServerEventStreamToken } from './server.tokens';

const DEFAULT_HOSTNAME = '127.0.0.1';

export const createServer = (config: CreateServerConfig): Server => {
  const { httpListener, event$, port, hostname, dependencies = [], options = {} } = config;

  const server = options.httpsOptions ? https.createServer(options.httpsOptions) : http.createServer();
  const serverEvent$ = subscribeServerEvents(hostname || DEFAULT_HOSTNAME)(server);

  const boundServerEvent$ = bindTo(ServerEventStreamToken)(() => serverEvent$);
  const boundServer = bindTo(ServerClientToken)(() => server);

  const context = registerAll([
    boundServer,
    boundServerEvent$,
    ...dependencies,
  ])(createContext());

  if (event$) {
    const ctx = createEffectContext({ ask: lookup(context), client: server });
    event$(serverEvent$, ctx).subscribe();
  }

  const listen = () => new Promise<https.Server | http.Server>((resolve, reject) => {
    const runningServer = server.listen(port, hostname);
    const httpListenerWithContext = httpListener(context);

    // @TODO: bind Routing

    runningServer.once('listening', () => resolve(runningServer));
    runningServer.once('error', error => reject(error));
    runningServer.once('close', runningServer.removeAllListeners);
    runningServer.on('request', httpListenerWithContext);
  });

  listen.context = context;

  return listen;
};
