import * as http from 'http';
import * as net from 'net';
import { Subject } from 'rxjs';
import { httpListener } from '../http.listener';
import { Event } from '../event/event.interface';
import { InjectionDependencies } from './server.injector';
import { ServerEffect } from '../effects/effects.interface';
import { ServerEvent, ServerEventType } from './server.event';

export interface MarbleConfig {
  port?: number;
  hostname?: string;
  httpListener: ReturnType<typeof httpListener>;
  httpEventsHandler?: ServerEffect;
  dependencies?: InjectionDependencies;
}

export const marble = ({ httpListener, httpEventsHandler, port, hostname, dependencies }: MarbleConfig) => {
  const { injector, routing } = httpListener.config;
  const httpEventsSubject$ = new Subject<Event>();
  const httpServer = http.createServer(httpListener);

  httpServer.on(ServerEventType.CONNECT, () =>
    httpEventsSubject$.next(ServerEvent.connect()),
  );

  httpServer.on(ServerEventType.CONNECTION, () =>
    httpEventsSubject$.next(ServerEvent.connection()),
  );

  httpServer.on(ServerEventType.CLIENT_ERROR, () =>
    httpEventsSubject$.next(ServerEvent.clientError()),
  );

  httpServer.on(ServerEventType.CLOSE, () =>
    httpEventsSubject$.next(ServerEvent.close()),
  );

  httpServer.on(ServerEventType.CHECK_CONTINUE, () =>
    httpEventsSubject$.next(ServerEvent.checkContinue()),
  );

  httpServer.on(ServerEventType.CHECK_EXPECTATION, () =>
    httpEventsSubject$.next(ServerEvent.checkExpectation()),
  );

  httpServer.on(ServerEventType.ERROR, () =>
    httpEventsSubject$.next(ServerEvent.error()),
  );

  httpServer.on(ServerEventType.REQUEST, () =>
    httpEventsSubject$.next(ServerEvent.request()),
  );

  httpServer.on(ServerEventType.UPGRADE, (req: http.IncomingMessage, socket: net.Socket, head: Buffer) =>
    httpEventsSubject$.next(ServerEvent.upgrade(req, socket, head)),
  );

  if (dependencies) {
    injector.registerAll(dependencies)(httpServer);
  }

  if (httpEventsHandler) {
    httpEventsHandler(httpEventsSubject$, httpServer, injector.get).subscribe();
  }

  httpServer.listen(port, hostname, () =>
    httpEventsSubject$.next(ServerEvent.listen(port!, hostname!)),
  );

  return {
    server: httpServer,
    info: { routing },
  };
};
