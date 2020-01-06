import { createEvent, EventsUnion, Event  } from '@marblejs/core';

export enum ServerEventType {
  STATUS = 'status',
  CLOSE = 'close',
  ERROR = 'error',
}

export const ServerEvent = {
  status: createEvent(
    ServerEventType.STATUS,
    (host: string, channel: string, type: string) => ({ host, channel, type }),
  ),
  close: createEvent(
    ServerEventType.CLOSE,
  ),
  error: createEvent(
    ServerEventType.ERROR,
    (error: Error) => ({ error }),
  )
};

export type AllServerEvents = EventsUnion<typeof ServerEvent>;

export function isStatusEvent(event: Event): event is ReturnType<typeof ServerEvent.status> {
  return event.type === ServerEventType.STATUS;
}

export function isCloseEvent(event: Event): event is ReturnType<typeof ServerEvent.close> {
  return event.type === ServerEventType.CLOSE;
}

export function isErrorEvent(event: Event): event is ReturnType<typeof ServerEvent.error> {
  return event.type === ServerEventType.ERROR;
}
