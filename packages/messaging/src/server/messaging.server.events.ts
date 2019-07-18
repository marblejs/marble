import { createEvent, EventsUnion, Event  } from '@marblejs/core';

export enum ServerEventType {
  LISTENING = 'listening',
  CLOSE = 'close',
  ERROR = 'error',
}

export const ServerEvent = {
  listening: createEvent(
    ServerEventType.LISTENING,
    (host: string, channel: string) => ({ host, channel }),
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

export function isListeningEvent(event: Event): event is ReturnType<typeof ServerEvent.listening> {
  return event.type === ServerEventType.LISTENING;
}

export function isCloseEvent(event: Event): event is ReturnType<typeof ServerEvent.close> {
  return event.type === ServerEventType.CLOSE;
}

export function isErrorEvent(event: Event): event is ReturnType<typeof ServerEvent.error> {
  return event.type === ServerEventType.ERROR;
}
