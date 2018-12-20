import * as http from 'http';
import { Observable, Subject } from 'rxjs';
import { httpListener } from './http.listener';
import { EventTypeBase, EventType } from './http.interface';

type HttpEventsHandler = (serverEvents$: Observable<EventTypeBase<EventType>>) => Observable<any>;

export interface MarbleConfig {
  port?: number;
  hostname?: string;
  httpListener: ReturnType<typeof httpListener>;
  httpEventsHandler?: HttpEventsHandler;
}

const eventsSubscriber =
  (httpServer: http.Server, event$: Subject<EventTypeBase>) =>
  (...eventTypes: EventType[]) =>
    eventTypes.forEach((type: any) =>
      httpServer.on(type, (...args) =>
        event$.next({ type, data: [...args]}),
      ),
    );

export const marble = ({ httpListener, httpEventsHandler, port, hostname }: MarbleConfig) => {
  const httpEvents$ = new Subject<EventTypeBase>();
  const httpServer = http.createServer(httpListener);
  const subscribeForEvents = eventsSubscriber(httpServer, httpEvents$);

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
    httpEventsHandler(httpEvents$).subscribe();
  }

  return httpServer.listen(port, hostname, () =>
    httpEvents$.next({
      type: EventType.LISTEN,
      data: [port!, hostname!],
    })
  );
};
