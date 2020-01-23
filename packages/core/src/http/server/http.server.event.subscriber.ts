import * as http from 'http';
import * as net from 'net';
import { Subject, Observable } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { HttpServer } from '../http.interface';
import { ServerEventType, ServerEvent, AllServerEvents, isCloseEvent } from './http.server.event';
import { DEFAULT_HOSTNAME } from './http.server.interface';

export const subscribeServerEvents = (hostname?: string) => (httpServer: HttpServer): Observable<AllServerEvents> => {
  const event$ = new Subject<AllServerEvents>();

  httpServer.on(ServerEventType.CONNECT, (req: http.IncomingMessage, socket: net.Socket, head: Buffer) =>
    event$.next(ServerEvent.connect(req, socket, head)),
  );

  httpServer.on(ServerEventType.CONNECTION, (socket: net.Socket) =>
    event$.next(ServerEvent.connection(socket)),
  );

  httpServer.on(ServerEventType.CLIENT_ERROR, (error: Error, socket: net.Socket) =>
    event$.next(ServerEvent.clientError(error, socket)),
  );

  httpServer.on(ServerEventType.CLOSE, () =>
    event$.next(ServerEvent.close()),
  );

  httpServer.on(ServerEventType.CHECK_CONTINUE, (req: http.IncomingMessage, res: http.ServerResponse) =>
    event$.next(ServerEvent.checkContinue(req, res)),
  );

  httpServer.on(ServerEventType.CHECK_EXPECTATION, (req: http.IncomingMessage, res: http.ServerResponse) =>
    event$.next(ServerEvent.checkExpectation(req, res)),
  );

  httpServer.on(ServerEventType.ERROR, (error: Error) =>
    event$.next(ServerEvent.error(error)),
  );

  httpServer.on(ServerEventType.REQUEST, (req: http.IncomingMessage, res: http.ServerResponse) =>
    event$.next(ServerEvent.request(req, res)),
  );

  httpServer.on(ServerEventType.UPGRADE, (req: http.IncomingMessage, socket: net.Socket, head: Buffer) =>
    event$.next(ServerEvent.upgrade(req, socket, head)),
  );

  httpServer.on(ServerEventType.LISTENING, () => {
    const serverAddressInfo = httpServer.address() as net.AddressInfo;
    event$.next(ServerEvent.listening(serverAddressInfo.port, hostname ?? DEFAULT_HOSTNAME));
  });

  return event$
    .asObservable()
    .pipe(takeWhile(e => !isCloseEvent(e)));
};
