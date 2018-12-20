import * as http from 'http';
import { Observable, Subject } from 'rxjs';
import { httpListener } from './http.listener';
import { HttpEvent, HttpEventType, HttpAllEvents } from './http.interface';

type HttpEventsHandler = (serverEvents$: Observable<HttpEvent<HttpEventType, any>>) => Observable<any>;

export interface MarbleConfig {
  port?: number;
  hostname?: string;
  httpListener: ReturnType<typeof httpListener>;
  httpEventsHandler?: HttpEventsHandler;
}

const eventsSubscriber =
  (httpServer: http.Server, event$: Subject<HttpAllEvents>) =>
  (...eventTypes: HttpEventType[]) =>
    eventTypes.forEach((type: any) =>
      httpServer.on(type, (...args) =>
        event$.next({ type, data: [...args]}),
      ),
    );

export const marble = ({ httpListener, httpEventsHandler, port, hostname }: MarbleConfig) => {
  const httpEvents$ = new Subject<HttpAllEvents>();
  const httpServer = http.createServer(httpListener);
  const subscribeForEvents = eventsSubscriber(httpServer, httpEvents$);

  subscribeForEvents(
    HttpEventType.CONNECT,
    HttpEventType.CONNECTION,
    HttpEventType.CLIENT_ERROR,
    HttpEventType.CLOSE,
    HttpEventType.CHECK_CONTINUE,
    HttpEventType.CHECK_EXPECTATION,
    HttpEventType.ERROR,
    HttpEventType.REQUEST,
    HttpEventType.UPGRADE,
  );

  if (httpEventsHandler) {
    httpEventsHandler(httpEvents$).subscribe();
  }

  return httpServer.listen(port, hostname, () =>
    httpEvents$.next({ type: HttpEventType.LISTEN, data: [port!, hostname!]})
  );
};
