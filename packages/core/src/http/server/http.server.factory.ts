import * as http from 'http';
import * as https from 'https';
import { createContext, lookup, registerAll, bindTo } from '../../context/context.factory';
import { createEffectContext } from '../../effects/effectsContext.factory';
import { insertIf, isTestingMetadataOn } from '../../+internal';
import { subscribeServerEvents } from './http.server.event.subscriber';
import { ServerClientToken, ServerEventStreamToken, ServerRequestMetadataStorageToken } from './http.server.tokens';
import { serverRequestMetadataStorage } from './http.server.metadata.storage';
import { CreateServerConfig, Server } from './http.server.interface';

const DEFAULT_HOSTNAME = '127.0.0.1';

export const createServer = (config: CreateServerConfig): Server => {
  const { httpListener, event$, port, hostname, dependencies = [], options = {} } = config;

  const server = options.httpsOptions ? https.createServer(options.httpsOptions) : http.createServer();
  const serverEvent$ = subscribeServerEvents(hostname || DEFAULT_HOSTNAME)(server);

  const boundServerEvent$ = bindTo(ServerEventStreamToken)(() => serverEvent$);
  const boundServer = bindTo(ServerClientToken)(() => server);
  const boundServerRequestMetadataStorage = bindTo(ServerRequestMetadataStorageToken)(serverRequestMetadataStorage);

  const context = registerAll([
    boundServer,
    boundServerEvent$,
    ...insertIf(isTestingMetadataOn(), boundServerRequestMetadataStorage),
    ...dependencies,
  ])(createContext());

  const listener = httpListener(context);

  if (event$) {
    const ctx = createEffectContext({ ask: lookup(context), client: server });
    event$(serverEvent$, ctx).subscribe();
  }

  const listen = () => new Promise<https.Server | http.Server>((resolve, reject) => {
    const runningServer = server.listen(port, hostname);

    // @TODO: bind Routing

    runningServer.once('listening', () => resolve(runningServer));
    runningServer.once('error', error => reject(error));
    runningServer.once('close', runningServer.removeAllListeners);
    runningServer.on('request', listener);
  });

  listen.context = context;

  return listen;
};
