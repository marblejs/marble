import * as IO from 'fp-ts/lib/IO';
import * as M from 'fp-ts/lib/Map';
import * as O from 'fp-ts/lib/Option';
import { ordString } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import { createReader, createContextToken, Event } from '@marblejs/core';

const createStore = () => new Map<string, NodeJS.Timeout>();

const getTimer = (store: Map<string, NodeJS.Timeout>) => (event: Event): readonly [string, NodeJS.Timeout] | undefined =>
  pipe(
    O.fromNullable(event.metadata?.correlationId),
    O.chain(eventId => pipe(
      M.lookup(ordString)(eventId, store),
      O.map(timer => ([eventId, timer] as const)),
    )),
    O.toUndefined,
  );

const register = (store: Map<string, NodeJS.Timeout>) => (timeout: number) => (handler: (() => any)) => (event: Event): IO.IO<void> =>
  pipe(
    IO.of(event.metadata?.correlationId),
    IO.chain(id => () => id && pipe(
      setTimeout(handler, timeout),
      timer => M.insertAt(ordString)(id, timer)(store),
    )),
  );

const unregister = (store: Map<string, NodeJS.Timeout>) => (event: Event): IO.IO<void> =>
  pipe(
    IO.of(event),
    IO.map(getTimer(store)),
    IO.chain(data => () => {
      data && clearTimeout(data[1]);
      data && store.delete(data[0]);
    }),
  );

/**
 * Dummy version of store for handling event timeouts.
 *
 * @since v3.3.0
 */
export const EventTimerStore = createReader(_ => pipe(
  createStore(),
  store => ({
    register: register(store),
    unregister: unregister(store),
  }),
));


export const EventTimerStoreToken = createContextToken<EventTimerStore>('EventTimerStore');

export type EventTimerStore = Readonly<ReturnType<typeof EventTimerStore>>;
