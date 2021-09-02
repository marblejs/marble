import { Event, matchEvent, combineEffects, act, EventError, contextFactory, bindEagerlyTo, lookup, useContext } from '@marblejs/core';
import { wait, NamedError } from '@marblejs/core/dist/+internal/utils';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { throwError, of, firstValueFrom, lastValueFrom, ReplaySubject } from 'rxjs';
import { delay, map, tap, ignoreElements, take } from 'rxjs/operators';
import { flow, pipe } from 'fp-ts/lib/function';
import { MsgEffect } from '../effects/messaging.effects.interface';
import { reply } from '../reply/reply';
import { messagingListener } from '../server/messaging.server.listener';
import { createEventBusTestBed } from '../util/messaging.test.util';
import { EventBusToken, eventBus } from './messaging.eventBus.reader';
import { EventBusClientToken, eventBusClient } from './messaging.eventBusClient.reader';

describe('#eventBus', () => {
  test('handles RPC event', async () => {
    const rpc$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        act(flow(
          eventValidator$(t.number),
          delay(10),
          map(event => reply(event)({ type: 'RPC_TEST_RESULT', payload: event.payload + 1 })),
        ))
      );

    const [eventBus, eventBusClient] = await createEventBusTestBed({ effects: [rpc$] });

    const event: Event = { type: 'RPC_TEST', payload: 1 };

    const result = await firstValueFrom(eventBusClient.send(event));

    expect(result).toEqual({ type: 'RPC_TEST_RESULT', payload: 2 });

    await eventBus.close();
    await eventBusClient.close();
  });

  test('handles parallel RPC events', async () => {
    const rpc1$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_1_TEST'),
        act(flow(
          eventValidator$(t.number),
          delay(10),
          map(event => reply(event)({ type: 'RPC_1_TEST_RESULT', payload: event.payload + 1 })),
        ))
      );

    const rpc2$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_2_TEST'),
        act(flow(
          eventValidator$(t.number),
          delay(10),
          map(event => reply(event)({ type: 'RPC_2_TEST_RESULT', payload: event.payload + 1 })),
        ))
      );

    const [eventBus, eventBusClient] = await createEventBusTestBed({ effects: [combineEffects(rpc1$, rpc2$)] });

    const event1: Event = { type: 'RPC_1_TEST', payload: 1 };
    const event2: Event = { type: 'RPC_2_TEST', payload: 2 };
    const event3: Event = { type: 'RPC_1_TEST', payload: 3 };
    const event4: Event = { type: 'RPC_2_TEST', payload: 4 };

    const result = await Promise.all([
      firstValueFrom(eventBusClient.send(event1)),
      firstValueFrom(eventBusClient.send(event2)),
      firstValueFrom(eventBusClient.send(event3)),
      firstValueFrom(eventBusClient.send(event4)),
    ]);

    expect(result).toEqual([
      { type: 'RPC_1_TEST_RESULT', payload: 2 },
      { type: 'RPC_2_TEST_RESULT', payload: 3 },
      { type: 'RPC_1_TEST_RESULT', payload: 4 },
      { type: 'RPC_2_TEST_RESULT', payload: 5 },
    ]);

    await eventBus.close();
    await eventBusClient.close();
  });

  test('handles parallel RPC with one errored event', async () => {
    const rpc1$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        act(flow(
          eventValidator$(t.number),
          delay(10),
        )),
      );

    const [eventBus, eventBusClient] = await createEventBusTestBed({ effects: [rpc1$] });

    const event1: Event = { type: 'RPC_TEST', payload: 1 };
    const event2: Event = { type: 'RPC_TEST', payload: '2' };
    const event3: Event = { type: 'RPC_TEST', payload: 3 };
    const event4: Event = { type: 'RPC_TEST', payload: 4 };

    const res1 = firstValueFrom(eventBusClient.send(event1));
    const res2 = firstValueFrom(eventBusClient.send(event2));
    const res3 = firstValueFrom(eventBusClient.send(event3));
    const res4 = firstValueFrom(eventBusClient.send(event4));

    await Promise.all([
      expect(res1).resolves.toEqual(event1),
      expect(res2).rejects.toBeInstanceOf(EventError),
      expect(res3).resolves.toEqual(event3),
      expect(res4).resolves.toEqual(event4),
    ]);

    await eventBus.close();
    await eventBusClient.close();
  });

  test('handles published event', async () => {
    // given
    const eventSubject = new ReplaySubject<Event>(1);

    const foo$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('TEST'),
        tap(event => eventSubject.next(event)),
        ignoreElements(),
      );

    const [eventBus, eventBusClient] = await createEventBusTestBed({ effects: [foo$] });
    const event: Event = { type: 'TEST', payload: 1 };

    // when
    await eventBusClient.emit(event);
    const result = await lastValueFrom(eventSubject.pipe(take(1)));

    // then
    expect(result.type).toEqual('TEST');
    expect(result.payload).toEqual(1);

    await wait();
    await eventBus.close();
    await eventBusClient.close();
  });

  test('handles RPC event error with direct mapping', async () => {
    const error = new NamedError('TestError_1', 'TestErrorMessage_1');

    const rpc$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        act(
          () => throwError(() => error),
          (error, event) => reply(event)({
            type: 'RPC_TEST_ERROR',
            error: { name: error.name, message: error.message },
          }),
        ),
      );

    const [eventBus, eventBusClient] = await createEventBusTestBed({ effects: [rpc$] });
    const event: Event = { type: 'RPC_TEST' };

    const result = firstValueFrom(eventBusClient.send(event));
    await expect(result).rejects.toEqual(error);

    await eventBus.close();
    await eventBusClient.close();
  });

  test('handles RPC event error with invalid direct mapping', async () => {
    const error = new NamedError('TestError_2', 'TestErrorMessage_2');

    const rpc$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        act(
          () => throwError(() => error),
          (error, event) => reply(event)({
            type: 'RPC_TEST_ERROR',
            error: { test: error.name },
          }),
        ),
      );

    const [eventBus, eventBusClient] = await createEventBusTestBed({ effects: [rpc$] });
    const event: Event = { type: 'RPC_TEST' };

    const result = firstValueFrom(eventBusClient.send(event));
    await expect(result).rejects.toEqual(new Error(`{"test":"${error.name}"}`));

    await eventBus.close();
    await eventBusClient.close();
  });

  test('handles RPC event error with indirect mapping', async () => {
    const error = new NamedError('TestError_3', 'TestErrorMessage_3');

    const rpc$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        act(() => throwError(() => error)),
      );

    const [eventBus, eventBusClient] = await createEventBusTestBed({ effects: [rpc$] });
    const event: Event = { type: 'RPC_TEST' };

    const result = firstValueFrom(eventBusClient.send(event));
    await expect(result).rejects.toEqual(error);

    await eventBus.close();
    await eventBusClient.close();
  });

  test('allows to set custom timeout', async () => {
    const timeout = 1;

    const rpc$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        act(event => pipe(
          of(reply(event)({ type: 'RPC_TEST_RESULT' })),
          delay(100),
        )),
      );

    const event: Event = { type: 'RPC_TEST' };
    const listener = messagingListener({ effects: [rpc$] });

    const ask = pipe(
      await contextFactory(
        bindEagerlyTo(EventBusToken)(eventBus({ listener, timeout })),
        bindEagerlyTo(EventBusClientToken)(eventBusClient),
      ),
      lookup,
    );

    const eventBusInstance = useContext(EventBusToken)(ask);
    const eventBusClientInstance = useContext(EventBusClientToken)(ask);

    expect(eventBusInstance.config.timeout).toEqual(timeout);

    const result = firstValueFrom(eventBusClientInstance.send(event));

    await expect(result).rejects.toEqual(expect.objectContaining({
      name: 'TimeoutError',
    }));

    await eventBusInstance.close();
    await eventBusClientInstance.close();
  });

  test('doesn\'t fail if event bus client is registered before main EventBus reader', async () => {
    const context = contextFactory(
      bindEagerlyTo(EventBusClientToken)(eventBusClient),
      bindEagerlyTo(EventBusToken)(eventBus({ listener: messagingListener() })),
    );

    await expect(context).resolves.toBeDefined();
  });
});
