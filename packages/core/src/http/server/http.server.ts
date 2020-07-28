import * as http from 'http';
import * as https from 'https';
import { Subject, merge, EMPTY } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { pipe } from 'fp-ts/lib/pipeable';
import { lookup, bindTo, bindEagerlyTo } from '../../context/context';
import { createEffectContext } from '../../effects/effectsContext.factory';
import { isTestingMetadataOn } from '../../+internal/testing';
import { insertIf } from '../../+internal/utils';
import { HttpRequest, HttpServer } from '../http.interface';
import { logContext } from '../../context/context.logger';
import { contextFactory } from '../../context/context.helper';
import { ServerIO } from '../../listener/listener.interface';
import { listening$, close$, error$ } from '../effects/http.effects';
import { LoggerTag } from '../../logger';
import { useContext } from '../../context/context.hook';
import { HttpServerClientToken, HttpRequestBusToken } from './http.server.tokens';
import { CreateServerConfig } from './http.server.interface';
import { isCloseEvent } from './http.server.event';

// internal dependencies
import { HttpRequestMetadataStorage, HttpRequestMetadataStorageToken } from './internal-dependencies/httpRequestMetadataStorage.reader';
import { HttpServerEventStreamToken, HttpServerEventStream } from './internal-dependencies/httpServerEventStream.reader';

export const createServer = async (config: CreateServerConfig) => {
  const { listener, event$, port, hostname, dependencies = [], options = {} } = config;

  const server = options.httpsOptions
    ? https.createServer(options.httpsOptions)
    : http.createServer();

  const boundHttpServerEvent = bindEagerlyTo(HttpServerEventStreamToken)(HttpServerEventStream({ server, hostname }));
  const boundHttpServerClient = bindTo(HttpServerClientToken)(() => server);
  const boundHttpRequestMetadataStorage = bindTo(HttpRequestMetadataStorageToken)(HttpRequestMetadataStorage);
  const boundHttpRequestBus = bindTo(HttpRequestBusToken)(() => new Subject<HttpRequest>());

  const context = await contextFactory(
    boundHttpServerClient,
    boundHttpServerEvent,
    boundHttpRequestBus,
    ...insertIf(isTestingMetadataOn())(boundHttpRequestMetadataStorage),
    ...dependencies,
  );

  logContext(LoggerTag.HTTP)(context);

  const ask = lookup(context);
  const ctx = createEffectContext({ ask, client: server });
  const httpListener = listener(context);
  const serverEvent$ = useContext(HttpServerEventStreamToken)(ask);

  pipe(
    merge(
      event$ ? event$(serverEvent$, ctx) : EMPTY,
      listening$(serverEvent$, ctx),
      error$(serverEvent$, ctx),
      close$(serverEvent$, ctx)),
    takeWhile(e => !isCloseEvent(e), true),
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
