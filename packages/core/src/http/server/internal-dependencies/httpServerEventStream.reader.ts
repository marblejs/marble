import * as http from 'http';
import * as net from 'net';
import { Subject } from 'rxjs';
import { createReader } from '../../../context/context.reader.factory';
import { HttpServer } from '../../http.interface';
import { AllServerEvents, ServerEventType, ServerEvent } from '../http.server.event';
import { DEFAULT_HOSTNAME } from '../http.server.interface';
import { createContextToken } from '../../../context/context.token.factory';

type HttpServerEventStreamOptions = { server: HttpServer, hostname?: string };

type HttpServerEventStream = ReturnType<ReturnType<typeof HttpServerEventStream>>;

export const HttpServerEventStreamToken = createContextToken<HttpServerEventStream>('HttpServerEventStream');

/**
 * HTTP server event stream reader responsible for subscribing to raw Node.js HTTP server events
 * and giving them in normalized Observable form
 */
export const HttpServerEventStream = (opts: HttpServerEventStreamOptions) => createReader(_ => {
  const { server, hostname } = opts;
  const event$ = new Subject<AllServerEvents>();

  server.on(ServerEventType.CONNECT, (req: http.IncomingMessage, socket: net.Socket, head: Buffer) =>
    event$.next(ServerEvent.connect(req, socket, head)),
  );

  server.on(ServerEventType.CONNECTION, (socket: net.Socket) =>
    event$.next(ServerEvent.connection(socket)),
  );

  server.on(ServerEventType.CLIENT_ERROR, (error: Error, socket: net.Socket) =>
    event$.next(ServerEvent.clientError(error, socket)),
  );

  server.on(ServerEventType.CLOSE, () =>
    event$.next(ServerEvent.close()),
  );

  server.on(ServerEventType.CHECK_CONTINUE, (req: http.IncomingMessage, res: http.ServerResponse) =>
    event$.next(ServerEvent.checkContinue(req, res)),
  );

  server.on(ServerEventType.CHECK_EXPECTATION, (req: http.IncomingMessage, res: http.ServerResponse) =>
    event$.next(ServerEvent.checkExpectation(req, res)),
  );

  server.on(ServerEventType.ERROR, (error: Error) =>
    event$.next(ServerEvent.error(error)),
  );

  server.on(ServerEventType.REQUEST, (req: http.IncomingMessage, res: http.ServerResponse) =>
    event$.next(ServerEvent.request(req, res)),
  );

  server.on(ServerEventType.UPGRADE, (req: http.IncomingMessage, socket: net.Socket, head: Buffer) =>
    event$.next(ServerEvent.upgrade(req, socket, head)),
  );

  server.on(ServerEventType.LISTENING, () => {
    const serverAddressInfo = server.address() as net.AddressInfo;
    event$.next(ServerEvent.listening(serverAddressInfo.port, hostname ?? DEFAULT_HOSTNAME));
  });

  return event$.asObservable();
});
