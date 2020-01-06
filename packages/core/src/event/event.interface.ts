export type EventType = string;

export interface Event<P = unknown, E = any, T extends EventType = EventType> {
  type: T;
  payload?: P;
  error?: E;
  raw?: any;
}

export interface ValidatedEvent<P = unknown, T extends EventType = EventType> {
  type: T;
  payload: P;
  raw?: any;
}

export type EventsUnion<A extends {
  [eventCreator: string]:  (...args: any[]) => any & { type?: string };
}> = ReturnType<A[keyof A]>;
