import * as http from 'http';
import { Subject } from 'rxjs';
import { httpListener } from './http.listener';
import { ServerEvent, EventType } from './http.interface';
import { ServerEffect } from './effects/effects.interface';

export interface MarbleConfig {
  port?: number;
  hostname?: string;
  httpListener: ReturnType<typeof httpListener>;
  httpEventsHandler?: ServerEffect;
}

const eventsSubscriber =
  (httpServer: http.Server, event$: Subject<ServerEvent>) =>
  (...eventTypes: EventType[]) =>
    eventTypes.forEach((type: any) =>
      httpServer.on(type, (...args) =>
        event$.next({ type, data: [...args]}),
      ),
    );

export const marble = ({ httpListener, httpEventsHandler, port, hostname }: MarbleConfig) => {
  const httpEventsSubject$ = new Subject<ServerEvent>();
  const httpServer = http.createServer(httpListener);
  const subscribeForEvents = eventsSubscriber(httpServer, httpEventsSubject$);

  subscribeForEvents(
    EventType.CONNECT,
    EventType.CONNECTION,
    EventType.CLIENT_ERROR,
    EventType.CLOSE,
    EventType.CHECK_CONTINUE,
    EventType.CHECK_EXPECTATION,
    EventType.ERROR,
    EventType.REQUEST,
    EventType.UPGRADE,
  );

  if (httpEventsHandler) {
    httpEventsHandler(httpEventsSubject$, httpServer).subscribe();
  }

  httpServer.listen(port, hostname, () =>
    httpEventsSubject$.next({
      type: EventType.LISTEN,
      data: [port!, hostname!],
    })
  );

  return {
    server: httpServer,
    info: httpListener.info,
  };
};
