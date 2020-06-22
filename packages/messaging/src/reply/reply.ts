import { Event, EventMetadata } from '@marblejs/core';
import { isString, NamedError } from '@marblejs/core/dist/+internal/utils';

export const UNKNOWN_TAG = '_UNKNOWN_';

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

const composeMetadata = (originMetadata?: EventMetadata) => (customMetadata?: EventMetadata): EventMetadata => ({
  raw: originMetadata?.raw ?? customMetadata?.raw,
  correlationId: originMetadata?.correlationId ?? customMetadata?.correlationId,
  replyTo: originMetadata?.replyTo ?? customMetadata?.replyTo ?? UNKNOWN_TAG,
});

export const reply = (to: string | EventMetadata | Event) => <T extends Event>(event: T): T => {
  assertEventType(event);

  return isString(to)
    ? { ...event, metadata: composeMetadata(event.metadata)({ replyTo: to }) }
    :  isEventMetadata(to)
      ? { ...event, metadata: composeMetadata(event.metadata)(to) }
      : { ...to, ...event, metadata: composeMetadata(event.metadata)(to.metadata) };
};
