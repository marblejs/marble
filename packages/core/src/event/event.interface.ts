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

export interface ValidatedEvent<P = unknown, T extends EventType = EventType> {
  type: T;
  payload: P;
  metadata?: EventMetadata;
}

export type EventsUnion<A extends {
  [eventCreator: string]:  (...args: any[]) => any & { type?: string };
}> = ReturnType<A[keyof A]>;
