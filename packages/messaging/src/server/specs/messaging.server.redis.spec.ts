import { matchEvent, act } from '@marblejs/core';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { forkJoin, firstValueFrom } from 'rxjs';
import { map, mapTo, tap, delay } from 'rxjs/operators';
import { flow } from 'fp-ts/lib/function';
import { TransportLayerConnection } from '../../transport/transport.interface';
import { MsgEffect } from '../../effects/messaging.effects.interface';
import { reply } from '../../reply/reply';
import * as Util from '../../util/messaging.test.util';
import { ackEvent } from '../../ack/ack';
import { MessagingClient } from '../../client/messaging.client';

describe('messagingServer::Redis', () => {
  let client: MessagingClient;
  let microservice: TransportLayerConnection;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());
  });

  afterEach(async () => {
    if (microservice) await microservice.close();
    if (client) await client.close();
  });

  test('starts a server and closes connection immediately', async () => {
    const options = Util.createRedisOptions();

    const microservice = await Util.createRedisMicroservice(options)({});
    const client = await Util.createRedisClient(options);

    await microservice.close();
    await client.close();
  });

  test('handles RPC communication', async () => {
    // given
    const options = Util.createRedisOptions();

    const increment$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('INCREMENT'),
        act(flow(
          eventValidator$(t.number),
          delay(50),
          map(event => ({ ...event, type: 'INCREMENT_RESULT', payload: event.payload + 1 })),
        )),
      );

    // when
    microservice = await Util.createRedisMicroservice(options)({ effects: [increment$] });
    client = await Util.createRedisClient(options);

    const result = await firstValueFrom(forkJoin([
      client.send({ type: 'INCREMENT', payload: 1 }),
      client.send({ type: 'INCREMENT', payload: 10 }),
    ]));

    // then
    expect(result[0]).toEqual({ type: 'INCREMENT_RESULT', payload: 2 });
    expect(result[1]).toEqual({ type: 'INCREMENT_RESULT', payload: 11 });
  });

  test('handles RPC communication when error event is returned', async () => {
    // given
    const options = Util.createRedisOptions();
    const error = new Error('test_error');

    const test$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('TEST'),
        map(event => reply(event)({ type: 'TEST_RESULT', error })),
      );

    // when
    microservice = await Util.createRedisMicroservice(options)({ effects: [test$] });
    client = await Util.createRedisClient(options);

    const result = firstValueFrom(client.send({ type: 'TEST' }));

    // then
    await expect(result).rejects.toEqual(error);
  });

  test('handles RPC communication when event is timeouted (eg. no event handler is defined)', async () => {
    // given
    const options = Util.createRedisOptions();

    // when
    microservice = await Util.createRedisMicroservice(options)();
    client = await Util.createRedisClient(options);

    const result = firstValueFrom(client.send({ type: 'TEST' }));

    // then
    await expect(result).rejects.toEqual(expect.objectContaining({
      name: 'TimeoutError',
    }));
  });

  test('handles non-blocking communication and routes the event back to origin channel', async () => {
    // given
    const { output$, output } = Util.prepareTestOutput({ take: 1 });
    const options = Util.createRedisOptions();

    const increment$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('INCREMENT'),
        act(flow(
          eventValidator$(t.number),
          delay(50),
          map(event => ({ ...event, type: 'INCREMENT_RESULT', payload: event.payload + 1 })),
        )),
      );

    microservice = await Util.createRedisMicroservice(options)({ effects: [increment$], output$ });
    client = await Util.createRedisClient(options);

    // when
    await client.emit({ type: 'INCREMENT', payload: 1 });
    const result = await output;

    // then
    expect(result).toEqual([{
      type: 'INCREMENT_RESULT',
      payload: 2,
      metadata: expect.objectContaining({ replyTo: options.channel, correlationId: expect.any(String) }),
    }]);
  });

  test('doesn\'t throw an "UnsupportedError" when calling "ackMessage/nackMessage"', async () => {
    // given
    const { output$, error$, output } = Util.prepareTestOutput({ take: 1 });
    const options = Util.createRedisOptions();

    const test$: MsgEffect = (event$, ctx) =>
      event$.pipe(
        matchEvent('TEST'),
        tap(event => ackEvent(ctx)(event)()),
        map(() => ({ type: 'TEST_OUTPUT' })),
      );

    microservice = await Util.createRedisMicroservice(options)({ effects: [test$], error$, output$ });
    client = await Util.createRedisClient(options);

    // when
    await client.emit({ type: 'TEST' });
    const result = await output;

    // then
    expect(result).toEqual([expect.objectContaining({
      type: 'TEST_OUTPUT',
    })]);
  });

  test('chains events by sending back to origin channel when no reply is defined', async () => {
    // given
    const { output$, output } = Util.prepareTestOutput({ take: 2 });
    const options = Util.createRedisOptions();

    const test1$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('TEST_1'),
        delay(25),
        mapTo({ type: 'TEST_2' }),
      );

    const test2$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('TEST_2'),
        delay(25),
        mapTo({ type: 'TEST_3' }),
      );

    microservice = await Util.createRedisMicroservice(options)({ effects: [test1$, test2$], output$ });
    client = await Util.createRedisClient(options);

    // when
    await client.emit({ type: 'TEST_1' });
    const result = await output;

    // then
    expect(result).toEqual([{
      type: 'TEST_2',
      metadata: expect.anything(),
    }, {
      type: 'TEST_3',
      metadata: expect.anything(),
    }]);
  });

  test('sends outgoing event to different channel and doesn\'t cause infinite loop', async () => {
    // given
    const { output$, output } = Util.prepareTestOutput({ take: 1 });
    const options = Util.createRedisOptions();
    const replyTo = createUuid();

    const test$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('TEST'),
        map(reply(replyTo)),
      );

    microservice = await Util.createRedisMicroservice(options)({ effects: [test$], output$ });
    client = await Util.createRedisClient(options);

    // when
    await client.emit({ type: 'TEST' });
    const result = await output;

    // then
    expect(result).toEqual([{
      type: 'TEST',
      metadata: expect.objectContaining({ replyTo }),
    }]);
  });

  test('microservice connection exposes raw configuration object', async () => {
    // given
    const options = Util.createRedisOptions();

    // when
    microservice = await Util.createRedisMicroservice(options)();

    // then
    expect(microservice.config.raw).toEqual(options);
  });
});
