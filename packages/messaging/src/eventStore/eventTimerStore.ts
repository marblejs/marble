import * as IO from 'fp-ts/lib/IO';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { constant } from 'fp-ts/lib/function';
import { createReader, createContextToken, Event } from '@marblejs/core';

type StoreKey = string;
type Store = Map<StoreKey, NodeJS.Timeout>;

const createStore = (): Store => new Map();

const setTimer = (store: Store) => (key: StoreKey) => (timeout: number) => (handler: IO.IO<any>): IO.IO<NodeJS.Timeout> => () =>
  pipe(
    pipe(handler, IO.chain(() => deleteTimerEntry(store)(key))),
    handler => setTimeout(handler, timeout),
  );

const clearTimer = (timer: NodeJS.Timeout): IO.IO<void> => () =>
  clearTimeout(timer);

const setTimerEntry = (store: Store) => (key: StoreKey) => (timer: NodeJS.Timeout): IO.IO<Store> => () =>
  pipe(
    store.set(key, timer),
    constant(store),
  );

const deleteTimerEntry = (store: Store) => (key: StoreKey): IO.IO<Store> => () =>
  pipe(
    store.delete(key),
    constant(store),
  );

const getTimer = (store: Store) => (event: Event): readonly [StoreKey, NodeJS.Timeout] | undefined =>
  pipe(
    O.fromNullable(event.metadata?.correlationId),
    O.chain(eventkey => pipe(
      O.fromNullable(store.get(eventkey)),
      O.map(timer => ([eventkey, timer] as const)),
    )),
    O.toUndefined,
  );

/**
 * Registers timeout handler for given event
 * @since v3.3.0
 */
const register = (store: Store) => (timeout: number) => <T>(handler: IO.IO<T>) => (event: Event): IO.IO<void> =>
  pipe(
    IO.of(event.metadata?.correlationId),
    IO.chain(key => key
      ? pipe(setTimer(store)(key)(timeout)(handler), IO.chain(setTimerEntry(store)(key)))
      : IO.of(undefined)),
  );

/**
 * Unregisters timeout handler for given event
 * @since v3.3.0
 */
const unregister = (store: Store) => (event: Event): IO.IO<void> =>
  pipe(
    IO.of(event),
    IO.map(getTimer(store)),
    IO.chain(entry => entry
      ? pipe(clearTimer(entry[1]), IO.chain(() => deleteTimerEntry(store)(entry[0])))
      : IO.of(undefined))
  );

/**
 * Dummy version of store for handling event timeouts.
 *
 * @since v3.3.0
 */
export const EventTimerStore = createReader(_ => pipe(
  createStore(),
  store => ({
    store,
    register: register(store),
    unregister: unregister(store),
  }),
));


export const EventTimerStoreToken = createContextToken<EventTimerStore>('EventTimerStore');

export type EventTimerStore = Readonly<ReturnType<typeof EventTimerStore>>;
