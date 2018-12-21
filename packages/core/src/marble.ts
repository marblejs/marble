import * as http from 'http';
import { Observable, Subject } from 'rxjs';
import { httpListener } from './http.listener';
import { MarbleEvent, EventType } from './http.interface';

type HttpEventsHandler = (serverEvents$: Observable<MarbleEvent<EventType>>) => Observable<any>;

export interface MarbleConfig {
  port?: number;
  hostname?: string;
  httpListener: ReturnType<typeof httpListener>;
  httpEventsHandler?: HttpEventsHandler;
}

const eventsSubscriber =
  (httpServer: http.Server, event$: Subject<MarbleEvent>) =>
  (...eventTypes: EventType[]) =>
    eventTypes.forEach((type: any) =>
      httpServer.on(type, (...args) =>
        event$.next({ type, data: [...args]}),
      ),
    );

export const marble = ({ httpListener, httpEventsHandler, port, hostname }: MarbleConfig) => {
  const httpEventsSubject$ = new Subject<MarbleEvent>();
  const httpServer = http.createServer(httpListener.server);
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
    httpEventsHandler(httpEventsSubject$).subscribe();
  }

  httpServer.listen(port, hostname, () =>
    httpEventsSubject$.next({
      type: EventType.LISTEN,
      data: [port!, hostname!],
    })
  );

  return {
    server: httpServer,
    info: {
      routing: httpListener.routing,
    },
  };
};
