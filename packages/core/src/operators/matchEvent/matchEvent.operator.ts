import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isString } from '../../+internal/utils';
import { Event } from '../../event/event.interface';
import { EventCreator } from '../../event/event.factory';

type EventLike = { type: string } | string;

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
  Event<unknown, any>
>;

export function matchEvent<
  E1 extends EventCreator<string, any>,
  E2 extends EventCreator<string, any>,
>(e1: E1, e2: E2): (o: Observable<Event>) => Observable<
  | ReturnType<E1>
  | ReturnType<E2>
>;

// 2 arguments
export function matchEvent<
  E1 extends EventLike,
  E2 extends EventLike,
>(e1: E1, e2: E2): (o: Observable<Event>) => Observable<
  Event<unknown, any>
>;

export function matchEvent<
  E1 extends EventCreator<string, any>,
  E2 extends EventCreator<string, any>,
>(e1: E1, e2: E2): (o: Observable<Event>) => Observable<
  | ReturnType<E1>
  | ReturnType<E2>
>;

// 1 argument
export function matchEvent<
  E1 extends EventCreator<string, any>
>(e1: E1): (o: Observable<Event>) => Observable<
  ReturnType<E1>
>;

export function matchEvent<
  E1 extends EventLike
>(e1: E1): (o: Observable<Event>) => Observable<
  | Event<unknown, any>
>;

// any arguments
export function matchEvent(...events: any[]) {
  return (source$: Observable<Event>) =>
    source$.pipe(
      filter(event => {
        const types = events.map(event => !isString(event) ? event.type : event);
        return types.includes(event.type);
      }),
    );
}
