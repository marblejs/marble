import { matchEvent, act } from '@marblejs/core';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { firstValueFrom, forkJoin } from 'rxjs';
import { map, tap, delay, mapTo } from 'rxjs/operators';
import { flow } from 'fp-ts/lib/function';
import { TransportLayerConnection } from '../../transport/transport.interface';
import { MsgEffect } from '../../effects/messaging.effects.interface';
import { MessagingClient } from '../../client/messaging.client.interface';
import { reply } from '../../reply/reply';
import * as Util from '../../util/messaging.test.util';
import { ackEvent } from '../../ack/ack';

describe('messagingServer::AMQP', () => {
  let client: MessagingClient;
  let microservice: TransportLayerConnection;

  afterEach(async () => {
    if (microservice) await microservice.close();
    if (client) await client.close();
  });

  test('starts a server and closes connection immediately', async () => {
    const options = Util.createAmqpOptions();

    const microservice = await Util.createAmqpMicroservice(options)({});
    const client = await Util.createAmqpClient(options);

    await microservice.close();
    await client.close();
  });

  test('handles RPC communication', async () => {
    // given
    const options = Util.createAmqpOptions();

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
    microservice = await Util.createAmqpMicroservice(options)({ effects: [increment$] });
    client = await Util.createAmqpClient(options);

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
    const options = Util.createAmqpOptions();
    const error = new Error('test_error');

    const test$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('TEST'),
        map(event => reply(event)({ type: 'TEST_RESULT', error })),
      );

    // when
    microservice = await Util.createAmqpMicroservice(options)({ effects: [test$] });
    client = await Util.createAmqpClient(options);

    const result = firstValueFrom(client.send({ type: 'TEST' }));

    // then
    await expect(result).rejects.toEqual(error);
  });

  test('handles RPC communication when event is timeouted (eg. no event handler is defined)', async () => {
    // given
    const options = Util.createAmqpOptions();

    // when
    microservice = await Util.createAmqpMicroservice(options)();
    client = await Util.createAmqpClient(options);

    const result = firstValueFrom(client.send({ type: 'TEST' }));

    // then
    await expect(result).rejects.toEqual(expect.objectContaining({
      name: 'TimeoutError',
    }));
  });

  test('handles non-blocking communication and routes the event back to origin channel', async () => {
    // given
    const options = Util.createAmqpOptions();
    const { output$, output } = Util.prepareTestOutput({ take: 1 });

    const increment$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('INCREMENT'),
        act(flow(
          eventValidator$(t.number),
          delay(50),
          map(event => ({ ...event, type: 'INCREMENT_RESULT', payload: event.payload + 1 })),
        ))
      );

    microservice = await Util.createAmqpMicroservice(options)({ effects: [increment$], output$ });
    client = await Util.createAmqpClient(options);

    // when
    await client.emit({ type: 'INCREMENT', payload: 1 });
    const result = await output;

    // then
    expect(result).toEqual([{
      type: 'INCREMENT_RESULT',
      payload: 2,
      metadata: expect.objectContaining({ replyTo: options.queue, correlationId: expect.any(String) }),
    }]);
  });

  test('acks subssequent events and doesn\'t block the consumer', async () => {
    // given
    const { output$, output } = Util.prepareTestOutput({ take: 2 });
    const optionsMicroservice = Util.createAmqpOptions({ expectAck: true });
    const optionsClient = Util.createAmqpOptions({ queue: optionsMicroservice.queue });

    const ack$: MsgEffect = (event$, ctx) =>
      event$.pipe(
        matchEvent('ACK'),
        delay(50),
        tap(event => ackEvent(ctx)(event)()),
        map(event => ({ type: 'ACK_RESPONSE', payload: event.payload })),
      );

    microservice = await Util.createAmqpMicroservice(optionsMicroservice)({ effects: [ack$], output$ });
    client = await Util.createAmqpClient(optionsClient);

    // when
    await client.emit({ type: 'ACK', payload: 1 });
    await client.emit({ type: 'ACK', payload: 2 });
    const result = await output;

    // then
    expect(result).toEqual([{
      type: 'ACK_RESPONSE',
      payload: 1,
      metadata: expect.anything(),
    }, {
      type: 'ACK_RESPONSE',
      payload: 2,
      metadata: expect.anything(),
    }]);
  });

  test('rejects unhandled event events and doesn\'t block the consumer', async () => {
    // given
    const { output$, output } = Util.prepareTestOutput({ take: 1 });
    const optionsMicroservice = Util.createAmqpOptions({ expectAck: true, timeout: 100 });
    const optionsClient = Util.createAmqpOptions({ queue: optionsMicroservice.queue });

    const ack$: MsgEffect = (event$, ctx) =>
      event$.pipe(
        matchEvent('ACK'),
        delay(50),
        tap(event => ackEvent(ctx)(event)()),
        map(event => ({ type: 'ACK_RESPONSE', payload: event.payload })),
      );

    microservice = await Util.createAmqpMicroservice(optionsMicroservice)({ effects: [ack$], output$ });
    client = await Util.createAmqpClient(optionsClient);

    // when
    await client.emit({ type: 'TEST' });
    await client.emit({ type: 'ACK', payload: 1 });
    const result = await output;

    // then
    expect(result).toEqual([{
      type: 'ACK_RESPONSE',
      payload: 1,
      metadata: expect.anything(),
    }]);
  });

  test('chains events by sending back to origin channel when no reply is defined', async () => {
    // given
    const { output$, output } = Util.prepareTestOutput({ take: 2 });
    const options = Util.createAmqpOptions();

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

    microservice = await Util.createAmqpMicroservice(options)({ effects: [test1$, test2$], output$ });
    client = await Util.createAmqpClient(options);

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
    const options = Util.createAmqpOptions();
    const replyTo = createUuid();

    const test$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('TEST'),
        map(reply(replyTo)),
      );

    microservice = await Util.createAmqpMicroservice(options)({ effects: [test$], output$ });
    client = await Util.createAmqpClient(options);

    // when
    await client.emit({ type: 'TEST' });
    const result = await output;

    // then
    expect(result).toEqual([{
      type: 'TEST',
      metadata: expect.objectContaining({ replyTo }),
    }]);
  });

  test('consumes pending messages after startup', async () => {
    // given
    const { output$, output } = Util.prepareTestOutput({ take: 1 });
    const options = Util.createAmqpOptions();
    const replyTo = createUuid();

    const test$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('TEST'),
        mapTo(reply(replyTo)({ type: 'TEST_RESULT' })),
      );

    // when (order matters)
    client = await Util.createAmqpClient(options);

    await client.emit({ type: 'TEST' });

    microservice = await Util.createAmqpMicroservice(options)({ effects: [test$], output$ });
    const result = await output;

    // then
    expect(result).toEqual([{
      type: 'TEST_RESULT',
      metadata: expect.anything(),
    }]);
  });

  test('microservice connection exposes raw configuration object', async () => {
    // given
    const options = Util.createAmqpOptions();

    // when
    microservice = await Util.createAmqpMicroservice(options)();

    // then
    expect(microservice.config.raw).toEqual(options);
  });
});
