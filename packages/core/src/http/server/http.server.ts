import * as http from 'http';
import * as https from 'https';
import * as net from 'net';
import { flow } from 'fp-ts/lib/function';
import { Subject } from 'rxjs';
import { createContext, lookup, registerAll, bindTo, resolve } from '../../context/context.factory';
import { createEffectContext } from '../../effects/effectsContext.factory';
import { isTestingMetadataOn } from '../../+internal/testing';
import { insertIf, isTestEnv } from '../../+internal/utils';
import { HttpRequest, HttpServer } from '../http.interface';
import { LoggerToken, logger, LoggerTag, mockLogger } from '../../logger';
import { useContext } from '../../context/context.hook';
import { logContext } from '../../context/context.logger';
import { ServerIO } from '../../listener/listener.interface';
import { subscribeServerEvents } from './http.server.event.subscriber';
import { HttpServerClientToken, HttpServerEventStreamToken, HttpRequestMetadataStorageToken, HttpRequestBusToken } from './http.server.tokens';
import { serverRequestMetadataStorage } from './http.server.metadata.storage';
import { CreateServerConfig } from './http.server.interface';

const DEFAULT_HOSTNAME = '127.0.0.1';

export const createServer = async (config: CreateServerConfig) => {
  const { httpListener, event$, port, hostname, dependencies = [], options = {} } = config;

  const server = options.httpsOptions ? https.createServer(options.httpsOptions) : http.createServer();
  const serverEvent$ = subscribeServerEvents(hostname || DEFAULT_HOSTNAME)(server);

  const boundLogger = bindTo(LoggerToken)(isTestEnv() ? mockLogger : logger);
  const boundHttpServerEvent = bindTo(HttpServerEventStreamToken)(() => serverEvent$);
  const boundHttpServerClient = bindTo(HttpServerClientToken)(() => server);
  const boundHttpRequestMetadataStorage = bindTo(HttpRequestMetadataStorageToken)(serverRequestMetadataStorage);
  const boundHttpRequestBus = bindTo(HttpRequestBusToken)(() => new Subject<HttpRequest>());

  const context = await flow(
    registerAll([
      boundLogger,
      boundHttpServerClient,
      boundHttpServerEvent,
      boundHttpRequestBus,
      ...insertIf(isTestingMetadataOn())(boundHttpRequestMetadataStorage),
      ...dependencies,
    ]),
    logContext(LoggerTag.HTTP),
    resolve,
  )(createContext());

  const ask = lookup(context);
  const providedLogger = useContext(LoggerToken)(ask);
  const listener = httpListener(context);

  if (event$) {
    const ctx = createEffectContext({ ask, client: server });
    event$(serverEvent$, ctx).subscribe();
  }

  const listen: ServerIO<HttpServer> = () => new Promise((resolve, reject) => {
    const runningServer = server.listen(port, hostname);

    // @TODO: bind Routing

    runningServer.on('request', listener);
    runningServer.once('error', error => reject(error));
    runningServer.once('close', runningServer.removeAllListeners);
    runningServer.once('listening', () => {
      const { port } = runningServer.address() as net.AddressInfo;
      const message = `Server running @ http://${hostname ?? DEFAULT_HOSTNAME}:${port}/ 🚀`;
      const log = providedLogger({ tag: LoggerTag.HTTP, type: 'Server', message });

      log();
      resolve(runningServer);
    });
  });

  listen.context = context;

  return listen;
};
