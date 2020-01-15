import * as http from 'http';
import * as https from 'https';
import { flow } from 'fp-ts/lib/function';
import { Subject } from 'rxjs';
import { createContext, lookup, registerAll, bindTo, resolve } from '../../context/context.factory';
import { createEffectContext } from '../../effects/effectsContext.factory';
import { insertIf, isTestingMetadataOn } from '../../+internal';
import { HttpRequest } from '../http.interface';
import { subscribeServerEvents } from './http.server.event.subscriber';
import { HttpServerClientToken, HttpServerEventStreamToken, HttpRequestMetadataStorageToken, HttpRequestBusToken } from './http.server.tokens';
import { serverRequestMetadataStorage } from './http.server.metadata.storage';
import { CreateServerConfig, Server } from './http.server.interface';

const DEFAULT_HOSTNAME = '127.0.0.1';

export const createServer = async (config: CreateServerConfig): Promise<Server> => {
  const { httpListener, event$, port, hostname, dependencies = [], options = {} } = config;

  const server = options.httpsOptions ? https.createServer(options.httpsOptions) : http.createServer();
  const serverEvent$ = subscribeServerEvents(hostname || DEFAULT_HOSTNAME)(server);

  const boundHttpServerEvent = bindTo(HttpServerEventStreamToken)(() => serverEvent$);
  const boundHttpServerClient = bindTo(HttpServerClientToken)(() => server);
  const boundHttpRequestMetadataStorage = bindTo(HttpRequestMetadataStorageToken)(serverRequestMetadataStorage);
  const boundHttpRequestBus = bindTo(HttpRequestBusToken)(() => new Subject<HttpRequest>());

  const context = await flow(
    registerAll([
      boundHttpServerClient,
      boundHttpServerEvent,
      boundHttpRequestBus,
      ...insertIf(isTestingMetadataOn(), boundHttpRequestMetadataStorage),
      ...dependencies,
    ]),
    resolve,
  )(createContext());

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
