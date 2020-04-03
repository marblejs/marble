import * as http from 'http';
import * as WebSocket from 'ws';
import { Subject, Observable } from 'rxjs';
import { ServerEventType, ServerEvent, AllServerEvents } from './websocket.server.event';
import { DEFAULT_HOSTNAME, WebSocketServerConnection } from './websocket.server.interface';

export const subscribeWebSocketEvents = (server: WebSocketServerConnection): {
  serverEvent$: Observable<AllServerEvents>;
  serverEventSubject: Subject<AllServerEvents>;
} => {
  const serverEventSubject = new Subject<AllServerEvents>();

  server.on(ServerEventType.HEADERS, (headers: string[], req: http.IncomingMessage) =>
    serverEventSubject.next(ServerEvent.headers(headers, req)),
  );

  server.on(ServerEventType.CLOSE, () =>
    serverEventSubject.next(ServerEvent.close()),
  );

  server.on(ServerEventType.ERROR, (error: Error) =>
    serverEventSubject.next(ServerEvent.error(error)),
  );

  server.on(ServerEventType.LISTENING, () => {
    const hostname = server.options.host ?? DEFAULT_HOSTNAME;
    const port = (server.address() as WebSocket.AddressInfo).port;
    serverEventSubject.next(ServerEvent.listening(port, hostname));
  });

  return {
    serverEvent$: serverEventSubject.asObservable(),
    serverEventSubject,
  };
};
