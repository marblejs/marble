import { matchEvent, use, createEvent } from '@marblejs/core';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { map, tap } from 'rxjs/operators';
import { Transport } from '../../transport/transport.interface';
import { MsgEffect, MsgErrorEffect } from '../../effects/messaging.effects.interface';
import { RedisStrategyOptions } from '../../transport/strategies/redis.strategy.interface';
import { runClient, runServer, createMessage, wait } from '../../util/messaging.test.util';

const createOptions = (config: { channel?: string } = {}): RedisStrategyOptions => ({
  host: 'redis://127.0.0.1:6379',
  channel: config.channel || 'test_channel_server',
});

describe('messagingServer::Redis', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());
  });

  test('starts a server and closes connection immediately', async () => {
    const options = createOptions();
    const client = await runClient(Transport.REDIS, options);
    const server = await runServer(Transport.REDIS, options)();

    await client.close();
    await server.close();
  });

  test('handles RPC event', async () => {
    const rpc$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('RPC_TEST'),
        use(eventValidator$(t.number)),
        map(event => event.payload),
        map(payload => ({ type: 'RPC_TEST_RESULT', payload: payload + 1 })),
      );

    const options = createOptions();
    const client = await runClient(Transport.REDIS, options);
    const server = await runServer(Transport.REDIS, options)(rpc$);
    const message = createMessage({ type: 'RPC_TEST', payload: 1 });

    const result = await client.sendMessage(options.channel, message);
    const parsedResult = JSON.parse(result.data.toString());

    expect(parsedResult).toEqual({ type: 'RPC_TEST_RESULT', payload: 2 });

    await server.close();
    await client.close();
  });

  test('handles published event', async done => {
    const event$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('EVENT_TEST'),
        use(eventValidator$(t.number)),
        map(event => event.payload),
        map(payload => ({ type: 'EVENT_TEST_RESPONSE', payload: payload + 1 })),
        tap(async event => {
          expect(event).toEqual({ type: 'EVENT_TEST_RESPONSE', payload: 2 });
          await wait();
          await server.close();
          await client.close();
          done();
        }),
      );

    const options = createOptions();
    const client = await runClient(Transport.REDIS, options);
    const server = await runServer(Transport.REDIS, options)(event$);
    const message = createMessage({ type: 'EVENT_TEST', payload: 1 });
    const emitResult = await client.emitMessage(options.channel, message);

    expect(emitResult).toEqual(true);
  });

  test('throws an UnsupportedError for unsupported "ackMessage/nackMessage"', async done => {
    const event$: MsgEffect = (event$, ctx) =>
      event$.pipe(
        matchEvent('EVENT_TEST'),
        tap(event => ctx.client.ackMessage(event.raw)),
      );

    const error$: MsgErrorEffect = event$ =>
      event$.pipe(
        tap(async ({ event, error }) => {
          expect(event).toBeUndefined();
          expect(error).toEqual(error);
          await wait();
          await server.close();
          await client.close();
          done();
        }),
        map(() => createEvent('ERROR')),
      );

    const options = createOptions();
    const client = await runClient(Transport.REDIS, options);
    const server = await runServer(Transport.REDIS, options)(event$, error$);
    const message = createMessage({ type: 'EVENT_TEST' });

    const emitResult = await client.emitMessage(options.channel, message);

    expect(emitResult).toEqual(true);
  });
});
