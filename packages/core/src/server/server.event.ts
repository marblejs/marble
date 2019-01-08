import * as http from 'http';
import * as net from 'net';
import { createEvent } from '../event/event.factory';
import { EventsUnion } from '../event/event.interface';

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
  LISTEN = 'listen',
}

export const ServerEvent = {
  connect: createEvent(ServerEventType.CONNECT),

  connection: createEvent(ServerEventType.CONNECTION),

  clientError: createEvent(ServerEventType.CLIENT_ERROR),

  close: createEvent(ServerEventType.CLOSE),

  checkContinue: createEvent(ServerEventType.CHECK_CONTINUE),

  checkExpectation: createEvent(ServerEventType.CHECK_EXPECTATION),

  error: createEvent(ServerEventType.ERROR),

  request: createEvent(ServerEventType.REQUEST),

  upgrade: createEvent(
    ServerEventType.UPGRADE,
    (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => ({ request, socket, head }),
  ),

  listen: createEvent(
    ServerEventType.LISTEN,
    (port: number, host: string) => ({ port, host }),
  ),
};

export type AllServerEvents = EventsUnion<typeof ServerEvent>;
