export type EventType = string;

export interface Event<T = unknown, U = any, V extends EventType = EventType> {
  type: V;
  payload?: T;
  error?: U;
}

export interface ValidatedEvent<T = unknown, V extends EventType = EventType> {
  type: V;
  payload: T;
}

export type EventsUnion<A extends {
  [eventCreator: string]:  (...args: any[]) => any & { type?: string };
}> = ReturnType<A[keyof A]>;
