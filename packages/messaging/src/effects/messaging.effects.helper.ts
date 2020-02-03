import { Event, EventMetadata } from '@marblejs/core';
import { isString, NamedError } from '@marblejs/core/dist/+internal/utils';

export class MissingEventTypeError extends NamedError {
  constructor() {
    super('MissingEventTypeError', `#reply - Missing type literal`);
  }
}

function assertEventType(event: Partial<Event>): asserts event is Required<Event> {
  if (!event.type) throw new MissingEventTypeError();
}

function isEventMetadata(metadata: any): metadata is EventMetadata {
  return metadata.correlationId || metadata.replyTo;
}

export const reply = (to: string | EventMetadata | Event) => <T extends Event>(event: T): T => {
  assertEventType(event);

  return isString(to)
    ? { ...event, metadata: { replyTo: to } }
    :  isEventMetadata(to)
      ? { ...event, metadata: to }
      : { ...to, ...event };
};
