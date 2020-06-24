import { createContext } from '@marblejs/core';
import { createUuid, wait } from '@marblejs/core/dist/+internal/utils';
import { EventTimerStore } from './eventTimerStore';

describe('EventTimerStore', () => {
  const ctx = createContext();

  test('registers event timeout for event with "correlationId"', () => {
    // given
    const timeout = 10 * 1000;
    const timeoutHandler = jest.fn();
    const event = { type: 'TEST', metadata: { correlationId: createUuid() } };
    const eventTimerStore = EventTimerStore(ctx);

    // when
    eventTimerStore.register(timeout)(timeoutHandler)(event)();

    // then
    const entry = eventTimerStore.store.get(event.metadata.correlationId);

    expect(entry).toBeDefined();
    expect(eventTimerStore.store.size).toEqual(1);

    if (entry) clearTimeout(entry);
  });

  test('doesn\'t register event timeout when event "correlationId" is not defined', () => {
    // given
    const timeout = 10 * 1000;
    const timeoutHandler = jest.fn();
    const event = { type: 'TEST' };
    const eventTimerStore = EventTimerStore(ctx);

    // when
    eventTimerStore.register(timeout)(timeoutHandler)(event)();

    // then
    expect(eventTimerStore.store.size).toEqual(0);
  });

  test('timeouts event after specified period and automatically removes entry from store', async () => {
    // given
    const timeout = 500;
    const timeoutHandler = jest.fn();
    const event = { type: 'TEST', metadata: { correlationId: createUuid() } };
    const eventTimerStore = EventTimerStore(ctx);

    // when
    eventTimerStore.register(timeout)(timeoutHandler)(event)();

    // then
    expect(eventTimerStore.store.size).toEqual(1);

    await wait(1);

    expect(timeoutHandler).toHaveBeenCalled();
    expect(eventTimerStore.store.size).toEqual(0);
  });

  test('manually unregisters timeout', async () => {
    // given
    const timeout = 5 * 1000;
    const timeoutHandler = jest.fn();
    const event = { type: 'TEST', metadata: { correlationId: createUuid() } };
    const eventTimerStore = EventTimerStore(ctx);

    // when, then
    eventTimerStore.register(timeout)(timeoutHandler)(event)();

    expect(eventTimerStore.store.size).toEqual(1);
    expect(timeoutHandler).not.toHaveBeenCalled();

    eventTimerStore.unregister(event)();

    expect(eventTimerStore.store.size).toEqual(0);
    expect(timeoutHandler).not.toHaveBeenCalled();
  });

  test('if timeout doesn\'t exist manual unregister doesn\'t fail', async () => {
    // given
    const event = { type: 'TEST', metadata: { correlationId: createUuid() } };
    const eventTimerStore = EventTimerStore(ctx);

    // when, then
    expect(eventTimerStore.store.size).toEqual(0);

    eventTimerStore.unregister(event)();

    expect(eventTimerStore.store.size).toEqual(0);
  });
});
