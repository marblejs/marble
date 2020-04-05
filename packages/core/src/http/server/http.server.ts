import * as http from 'http';
import * as https from 'https';
import { flow } from 'fp-ts/lib/function';
import { Subject, merge, EMPTY } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { createContext, lookup, registerAll, bindTo, resolve } from '../../context/context.factory';
import { createEffectContext } from '../../effects/effectsContext.factory';
import { isTestingMetadataOn } from '../../+internal/testing';
import { insertIf, isTestEnv } from '../../+internal/utils';
import { HttpRequest, HttpServer } from '../http.interface';
import { LoggerToken, logger, LoggerTag, mockLogger } from '../../logger';
import { logContext } from '../../context/context.logger';
import { ServerIO } from '../../listener/listener.interface';
import { listening$, close$, error$ } from '../effects/http.effects';
import { subscribeServerEvents } from './http.server.event.subscriber';
import { HttpServerClientToken, HttpServerEventStreamToken, HttpRequestMetadataStorageToken, HttpRequestBusToken } from './http.server.tokens';
import { httpRequestMetadataStorage } from './http.server.metadata.storage';
import { CreateServerConfig } from './http.server.interface';
import { isCloseEvent } from './http.server.event';

export const createServer = async (config: CreateServerConfig) => {
  const { listener, event$, port, hostname, dependencies = [], options = {} } = config;

  const server = options.httpsOptions ? https.createServer(options.httpsOptions) : http.createServer();
  const serverEvent$ = subscribeServerEvents(hostname)(server);

  const boundLogger = bindTo(LoggerToken)(isTestEnv() ? mockLogger : logger);
  const boundHttpServerEvent = bindTo(HttpServerEventStreamToken)(() => serverEvent$);
  const boundHttpServerClient = bindTo(HttpServerClientToken)(() => server);
  const boundHttpRequestMetadataStorage = bindTo(HttpRequestMetadataStorageToken)(httpRequestMetadataStorage);
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
  const ctx = createEffectContext({ ask, client: server });
  const httpListener = listener(context);

  merge(
    event$ ? event$(serverEvent$, ctx) : EMPTY,
    listening$(serverEvent$, ctx),
    error$(serverEvent$, ctx),
    close$(serverEvent$, ctx),
  ).pipe(
    takeWhile(e => !isCloseEvent(e), true)
  ).subscribe();

  const listen: ServerIO<HttpServer> = () => new Promise((resolve, reject) => {
    const runningServer = server.listen(port, hostname);

    // @TODO: bind Routing

    runningServer.on('request', httpListener);
    runningServer.on('close', runningServer.removeAllListeners);
    runningServer.on('error', reject);
    runningServer.on('listening', () => resolve(runningServer));
  });

  listen.context = context;

  return listen;
};
