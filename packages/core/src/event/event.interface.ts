export type EventType = string;

export interface EventMetadata {
  correlationId?: string;
  replyTo?: string;
  raw?: any;
}

export interface Event<P = unknown, E = any, T extends EventType = EventType> {
  type: T;
  payload?: P;
  error?: E;
  metadata?: EventMetadata;
}


export interface EventWithoutPayload<T extends EventType = EventType> {
  type: T;
  metadata?: EventMetadata;
}

export interface EventWithPayload<P = unknown, T extends EventType = EventType> {
  type: T;
  payload: P;
  metadata?: EventMetadata;
}

export type ValidatedEvent<P = unknown, T extends EventType = EventType> =
  EventWithPayload<P, T>

export type EventsUnion<A extends {
  [eventCreator: string]:  (...args: any[]) => any & { type?: string };
}> = ReturnType<A[keyof A]>;
