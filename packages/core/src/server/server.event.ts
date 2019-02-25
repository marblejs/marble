import * as http from 'http';
import * as net from 'net';
import { createEvent } from '../event/event.factory';
import { EventsUnion, Event } from '../event/event.interface';

export enum ServerEventType {
  CONNECT = 'connect',
  CONNECTION = 'connection',
  CLIENT_ERROR = 'clientError',
  CLOSE = 'close',
  CHECK_CONTINUE = 'checkContinue',
  CHECK_EXPECTATION = 'checkExpectation',
  ERROR = 'error',
  REQUEST = 'request',
  UPGRADE = 'upgrade',
  LISTENING = 'listening',
}

export const ServerEvent = {
  connect: createEvent(
    ServerEventType.CONNECT,
    (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => ({ request, socket, head }),
  ),

  connection: createEvent(
    ServerEventType.CONNECTION,
    (socket: net.Socket) => ({ socket }),
  ),

  clientError: createEvent(
    ServerEventType.CLIENT_ERROR,
    (error: Error, socket: net.Socket) => ({ error, socket }),
  ),

  close: createEvent(ServerEventType.CLOSE),

  checkContinue: createEvent(
    ServerEventType.CHECK_CONTINUE,
    (request: http.IncomingMessage, response: http.ServerResponse) => ({ request, response }),
  ),

  checkExpectation: createEvent(
    ServerEventType.CHECK_EXPECTATION,
    (request: http.IncomingMessage, response: http.ServerResponse) => ({ request, response }),
  ),

  error: createEvent(
    ServerEventType.ERROR,
    (error: Error) => ({ error }),
  ),

  request: createEvent(
    ServerEventType.REQUEST,
    (request: http.IncomingMessage, response: http.ServerResponse) => ({ request, response }),
  ),

  upgrade: createEvent(
    ServerEventType.UPGRADE,
    (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => ({ request, socket, head }),
  ),

  listening: createEvent(
    ServerEventType.LISTENING,
    (port: number, host: string) => ({ port, host }),
  ),
};

export type AllServerEvents = EventsUnion<typeof ServerEvent>;

export function isConnectEvent(event: Event): event is ReturnType<typeof ServerEvent.connect> {
  return event.type === ServerEventType.CONNECT;
}

export function isConnectionEvent(event: Event): event is ReturnType<typeof ServerEvent.connection> {
  return event.type === ServerEventType.CONNECTION;
}

export function isClientErrorEvent(event: Event): event is ReturnType<typeof ServerEvent.clientError> {
  return event.type === ServerEventType.CLIENT_ERROR;
}

export function isCloseEvent(event: Event): event is ReturnType<typeof ServerEvent.close> {
  return event.type === ServerEventType.CLOSE;
}

export function isCheckContinueEvent(event: Event): event is ReturnType<typeof ServerEvent.checkContinue> {
  return event.type === ServerEventType.CHECK_CONTINUE;
}

export function isCheckExpectationEvent(event: Event): event is ReturnType<typeof ServerEvent.checkExpectation> {
  return event.type === ServerEventType.CHECK_EXPECTATION;
}

export function isListeningEvent(event: Event): event is ReturnType<typeof ServerEvent.listening> {
  return event.type === ServerEventType.LISTENING;
}

export function isUpgradeEvent(event: Event): event is ReturnType<typeof ServerEvent.upgrade> {
  return event.type === ServerEventType.UPGRADE;
}

export function isErrorEvent(event: Event): event is ReturnType<typeof ServerEvent.error> {
  return event.type === ServerEventType.ERROR;
}

export function isRequestEvent(event: Event): event is ReturnType<typeof ServerEvent.request> {
  return event.type === ServerEventType.REQUEST;
}
