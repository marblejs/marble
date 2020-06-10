import * as t from 'io-ts';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isString } from '../../+internal/utils';
import { Event, EventMetadata } from '../../event/event.interface';
import { EventCreator } from '../../event/event.factory';

type EventSchema = t.Type<any, any, any>;

type EventLike =
  | { type: string }
  | string
  ;

type MachingEvent =
  | EventLike
  | EventSchema
  | EventCreator<string, any>
  ;

// 3 arguments
export function matchEvent<
  E1 extends EventSchema,
  E2 extends EventSchema,
  E3 extends EventSchema,
>(e1: E1, e2: E2, e3: E3): (o: Observable<Event>) => Observable<
  | t.TypeOf<E1> & { metadata: EventMetadata }
  | t.TypeOf<E2> & { metadata: EventMetadata }
  | t.TypeOf<E3> & { metadata: EventMetadata }
>;

export function matchEvent<
  E1 extends EventCreator<string, any>,
  E2 extends EventCreator<string, any>,
  E3 extends EventCreator<string, any>,
>(e1: E1, e2: E2, e3: E3): (o: Observable<Event>) => Observable<
  | ReturnType<E1>
  | ReturnType<E2>
  | ReturnType<E3>
>;

export function matchEvent<
  E1 extends EventLike,
  E2 extends EventLike,
  E3 extends EventLike,
>(e1: E1, e2: E2, e3: E3): (o: Observable<Event>) => Observable<
  | Event<unknown, any>
>;

// 2 arguments
export function matchEvent<
  E1 extends EventSchema,
  E2 extends EventSchema,
>(e1: E1, e2: E2): (o: Observable<Event>) => Observable<
  | t.TypeOf<E1> & { metadata: EventMetadata }
  | t.TypeOf<E2> & { metadata: EventMetadata }
>;

export function matchEvent<
  E1 extends EventCreator<string, any>,
  E2 extends EventCreator<string, any>,
>(e1: E1, e2: E2): (o: Observable<Event>) => Observable<
  | ReturnType<E1>
  | ReturnType<E2>
>;

export function matchEvent<
  E1 extends EventLike,
  E2 extends EventLike,
>(e1: E1, e2: E2): (o: Observable<Event>) => Observable<
  | Event<unknown, any>
>;

// 1 argument
export function matchEvent<
  E1 extends EventSchema,
>(e1: E1): (o: Observable<Event>) => Observable<
  | t.TypeOf<E1> & { metadata: EventMetadata }
>;

export function matchEvent<
  E1 extends EventCreator<string, any>,
>(e1: E1): (o: Observable<Event>) => Observable<
  | ReturnType<E1>
>;

export function matchEvent<
  E1 extends EventLike,
>(e1: E1): (o: Observable<Event>) => Observable<
  | Event<unknown, any>
>;

// any arguments
export function matchEvent(...events: MachingEvent[]) {
  const isEventSchema = (event: any): event is EventSchema =>
    event.name === 'EventSchema';

  const match = (incomingEvent: Event) => (matchingEvent: MachingEvent): boolean =>
    isEventSchema(matchingEvent)
      ? matchingEvent.is(incomingEvent)
      : isString(matchingEvent)
        ? matchingEvent === incomingEvent.type
        : matchingEvent.type ===  incomingEvent.type;

  return (source$: Observable<Event>) =>
    source$.pipe(
      filter(incomingEvent => events.some(match(incomingEvent))),
    );
}
