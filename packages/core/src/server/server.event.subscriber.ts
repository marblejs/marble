import * as http from 'http';
import * as https from 'https';
import * as net from 'net';
import { Subject } from 'rxjs';
import { ServerEventType, ServerEvent, AllServerEvents } from './server.event';

export const subscribeServerEvents = (port?: number, hostname?: string) => (httpServer: http.Server | https.Server) => {
  const event$ = new Subject<AllServerEvents>();

  httpServer.on(ServerEventType.CONNECT, () =>
    event$.next(ServerEvent.connect()),
  );

  httpServer.on(ServerEventType.CONNECTION, () =>
    event$.next(ServerEvent.connection()),
  );

  httpServer.on(ServerEventType.CLIENT_ERROR, () =>
    event$.next(ServerEvent.clientError()),
  );

  httpServer.on(ServerEventType.CLOSE, () =>
    event$.next(ServerEvent.close()),
  );

  httpServer.on(ServerEventType.CHECK_CONTINUE, () =>
    event$.next(ServerEvent.checkContinue()),
  );

  httpServer.on(ServerEventType.CHECK_EXPECTATION, () =>
    event$.next(ServerEvent.checkExpectation()),
  );

  httpServer.on(ServerEventType.ERROR, () =>
    event$.next(ServerEvent.error()),
  );

  httpServer.on(ServerEventType.REQUEST, () =>
    event$.next(ServerEvent.request()),
  );

  httpServer.on(ServerEventType.UPGRADE, (req: http.IncomingMessage, socket: net.Socket, head: Buffer) =>
    event$.next(ServerEvent.upgrade(req, socket, head)),
  );

  httpServer.listen(port, hostname, () =>
    event$.next(ServerEvent.listen(port!, hostname!)),
  );

  return event$;
};
