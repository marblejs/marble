import * as http from 'http';
import { createEvent, EventsUnion, Event  } from '@marblejs/core';
import { WebSocketClientConnection } from './websocket.server.interface';

export enum ServerEventType {
  LISTENING = 'listening',
  HEADERS = 'headers',
  CONNECTION = 'connection',
  CLOSE = 'close',
  CLOSE_CLIENT = 'close_client',
  ERROR = 'error',
}

export const ServerEvent = {
  listening: createEvent(
    ServerEventType.LISTENING,
    (port: number, host: string) => ({ port, host }),
  ),
  headers: createEvent(
    ServerEventType.HEADERS,
    (headers: string[], req: http.IncomingMessage) => ({ headers, req }),
  ),
  connection: createEvent(
    ServerEventType.CONNECTION,
    (client: WebSocketClientConnection, req: http.IncomingMessage) => ({ client, req }),
  ),
  close: createEvent(
    ServerEventType.CLOSE,
   ),
  closeClient: createEvent(
    ServerEventType.CLOSE_CLIENT,
    (client: WebSocketClientConnection) => ({ client }),
  ),
  error: createEvent(
    ServerEventType.ERROR,
    (error: Error) => ({ error }),
  )
};

export type AllServerEvents = EventsUnion<typeof ServerEvent>;

export function isListeningEvent(event: Event): event is ReturnType<typeof ServerEvent.listening> {
  return event.type === ServerEventType.LISTENING;
}

export function isHeadersEvent(event: Event): event is ReturnType<typeof ServerEvent.headers> {
  return event.type === ServerEventType.HEADERS;
}

export function isConnectionEvent(event: Event): event is ReturnType<typeof ServerEvent.connection> {
  return event.type === ServerEventType.CONNECTION;
}

export function isCloseEvent(event: Event): event is ReturnType<typeof ServerEvent.close> {
  return event.type === ServerEventType.CLOSE;
}

export function isCloseClientEvent(event: Event): event is ReturnType<typeof ServerEvent.closeClient> {
  return event.type === ServerEventType.CLOSE_CLIENT;
}

export function isErrorEvent(event: Event): event is ReturnType<typeof ServerEvent.error> {
  return event.type === ServerEventType.ERROR;
}
