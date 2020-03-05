import { Event, matchEvent, use, combineEffects, act, EventError } from '@marblejs/core';
import { wait, NamedError } from '@marblejs/core/dist/+internal/utils';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { throwError, of } from 'rxjs';
import { delay, map, tap, ignoreElements } from 'rxjs/operators';
import { MsgEffect } from '../effects/messaging.effects.interface';
import { runEventBus, runEventBusClient } from '../util/messaging.test.util';
import { reply } from '../effects/messaging.effects.helper';

describe('#eventBus', () => {
  test('handles RPC event', async () => {
    const rpc$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        use(eventValidator$(t.number)),
        delay(10),
        map(event => reply(event)({ type: 'RPC_TEST_RESULT', payload: event.payload + 1 })),
      );

    const eventBus = await runEventBus(rpc$);
    const eventBusClient = await runEventBusClient();
    const event: Event = { type: 'RPC_TEST', payload: 1 };

    const result = await eventBusClient.send(event).toPromise();

    expect(result).toEqual({ type: 'RPC_TEST_RESULT', payload: 2 });

    await eventBus.close();
    await eventBusClient.close();
  });

  test('handles parallel RPC events', async () => {
    const rpc1$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_1_TEST'),
        use(eventValidator$(t.number)),
        delay(10),
        map(event => reply(event)({ type: 'RPC_1_TEST_RESULT', payload: event.payload + 1 })),
      );

    const rpc2$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_2_TEST'),
        use(eventValidator$(t.number)),
        delay(10),
        map(event => reply(event)({ type: 'RPC_2_TEST_RESULT', payload: event.payload + 1 })),
      );

    const eventBus = await runEventBus(combineEffects(rpc1$, rpc2$));
    const eventBusClient = await runEventBusClient();

    const event1: Event = { type: 'RPC_1_TEST', payload: 1 };
    const event2: Event = { type: 'RPC_2_TEST', payload: 2 };
    const event3: Event = { type: 'RPC_1_TEST', payload: 3 };
    const event4: Event = { type: 'RPC_2_TEST', payload: 4 };

    const result = await Promise.all([
      eventBusClient.send(event1).toPromise(),
      eventBusClient.send(event2).toPromise(),
      eventBusClient.send(event3).toPromise(),
      eventBusClient.send(event4).toPromise(),
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
        act(event => of(event).pipe(
          use(eventValidator$(t.number)),
          delay(10),
        )),
      );

    const eventBus = await runEventBus(rpc1$);
    const eventBusClient = await runEventBusClient();

    const event1: Event = { type: 'RPC_TEST', payload: 1 };
    const event2: Event = { type: 'RPC_TEST', payload: '2' };
    const event3: Event = { type: 'RPC_TEST', payload: 3 };
    const event4: Event = { type: 'RPC_TEST', payload: 4 };

    const res1 = eventBusClient.send(event1).toPromise();
    const res2 = eventBusClient.send(event2).toPromise();
    const res3 = eventBusClient.send(event3).toPromise();
    const res4 = eventBusClient.send(event4).toPromise();

    await Promise.all([
      expect(res1).resolves.toEqual(event1),
      expect(res2).rejects.toBeInstanceOf(EventError),
      expect(res3).resolves.toEqual(event3),
      expect(res4).resolves.toEqual(event4),
    ]);

    await eventBus.close();
    await eventBusClient.close();
  });

  test('handles published event', async done => {
    const foo$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('TEST'),
        tap(async event => {
          expect(event.type).toEqual('TEST');
          expect(event.payload).toEqual(1);

          await wait();
          await eventBus.close();
          await eventBusClient.close();
          done();
        }),
        ignoreElements(),
      );

    const eventBus = await runEventBus(foo$);
    const eventBusClient = await runEventBusClient();
    const event: Event = { type: 'TEST', payload: 1 };

    await eventBusClient.emit(event);
  });

  test('handles RPC event error with direct mapping', async () => {
    const error = new NamedError('TestError_1', 'TestErrorMessage_1');

    const rpc$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        act(
          () => throwError(error),
          (error, event) => reply(event)({
            type: 'RPC_TEST_ERROR',
            error: { name: error.name, message: error.message },
          }),
        ),
      );

    const eventBus = await runEventBus(rpc$);
    const eventBusClient = await runEventBusClient();
    const event: Event = { type: 'RPC_TEST' };

    const result = eventBusClient.send(event).toPromise();
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
          () => throwError(error),
          (error, event) => reply(event)({
            type: 'RPC_TEST_ERROR',
            error: { test: error.name },
          }),
        ),
      );

    const eventBus = await runEventBus(rpc$);
    const eventBusClient = await runEventBusClient();
    const event: Event = { type: 'RPC_TEST' };

    const result = eventBusClient.send(event).toPromise();
    await expect(result).rejects.toEqual(new Error(`{"test":"${error.name}"}`));

    await eventBus.close();
    await eventBusClient.close();
  });

  test('handles RPC event error with indirect mapping', async () => {
    const error = new NamedError('TestError_3', 'TestErrorMessage_3');

    const rpc$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        act(() => throwError(error)),
      );

    const eventBus = await runEventBus(rpc$);
    const eventBusClient = await runEventBusClient();
    const event: Event = { type: 'RPC_TEST' };

    const result = eventBusClient.send(event).toPromise();
    await expect(result).rejects.toEqual(error);

    await eventBus.close();
    await eventBusClient.close();
  });
});
