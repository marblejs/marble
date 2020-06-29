import { matchEvent, use } from '@marblejs/core';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { eventValidator$, t } from '@marblejs/middleware-io';
import { forkJoin, TimeoutError } from 'rxjs';
import { map, tap, delay, mapTo } from 'rxjs/operators';
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
        use(eventValidator$(t.number)),
        delay(50),
        map(event => ({ ...event, type: 'INCREMENT_RESULT', payload: event.payload + 1 })),
      );

    // when
    microservice = await Util.createAmqpMicroservice(options)({ effects: [increment$] });
    client = await Util.createAmqpClient(options);

    const result = await forkJoin([
      client.send({ type: 'INCREMENT', payload: 1 }),
      client.send({ type: 'INCREMENT', payload: 10 }),
    ]).toPromise();

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

    const result = client.send({ type: 'TEST' }).toPromise();

    // then
    await expect(result).rejects.toEqual(error);
  });

  test('handles RPC communication when event is timeouted (eg. no event handler is defined)', async () => {
    // given
    const options = Util.createAmqpOptions();

    // when
    microservice = await Util.createAmqpMicroservice(options)();
    client = await Util.createAmqpClient(options);

    const result = client.send({ type: 'TEST' }).toPromise();

    // then
    await expect(result).rejects.toEqual(new TimeoutError());
  });

  test('handles non-blocking communication and routes the event back to origin channel', async done => {
    // given
    const options = Util.createAmqpOptions();

    const increment$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('INCREMENT'),
        use(eventValidator$(t.number)),
        delay(50),
        map(event => ({ ...event, type: 'INCREMENT_RESULT', payload: event.payload + 1 })),
      );

    // then
    const output$ = Util.assertOutputEvent({
      type: 'INCREMENT_RESULT',
      payload: 2,
      metadata: expect.objectContaining({ replyTo: options.queue, correlationId: expect.any(String) }),
    })(done);

    // when
    microservice = await Util.createAmqpMicroservice(options)({ effects: [increment$], output$ });
    client = await Util.createAmqpClient(options);

    await client.emit({ type: 'INCREMENT', payload: 1 });
  });


  test('acks subssequent events and doesn\'t block the consumer', async done => {
    // given
    const optionsMicroservice = Util.createAmqpOptions({ expectAck: true });
    const optionsClient = Util.createAmqpOptions({ queue: optionsMicroservice.queue });

    const ack$: MsgEffect = (event$, ctx) =>
      event$.pipe(
        matchEvent('ACK'),
        delay(50),
        tap(event => ackEvent(ctx)(event)()),
        map(event => ({ type: 'ACK_RESPONSE', payload: event.payload })),
      );

    // then
    const output$ = Util.assertOutputEvent(
      { type: 'ACK_RESPONSE' },
      { type: 'ACK_RESPONSE' },
    )(done);

    // when
    microservice = await Util.createAmqpMicroservice(optionsMicroservice)({ effects: [ack$], output$ });
    client = await Util.createAmqpClient(optionsClient);

    await client.emit({ type: 'ACK', payload: 1 });
    await client.emit({ type: 'ACK', payload: 2 });
  });

  test('rejects unhandled event events and doesn\'t block the consumer', async done => {
    // given
    const optionsMicroservice = Util.createAmqpOptions({ expectAck: true, timeout: 100 });
    const optionsClient = Util.createAmqpOptions({ queue: optionsMicroservice.queue });

    const ack$: MsgEffect = (event$, ctx) =>
      event$.pipe(
        matchEvent('ACK'),
        delay(50),
        tap(event => ackEvent(ctx)(event)()),
        map(event => ({ type: 'ACK_RESPONSE', payload: event.payload })),
      );

    // then
    const output$ = Util.assertOutputEvent(
      { type: 'ACK_RESPONSE' },
    )(done);

    // when
    microservice = await Util.createAmqpMicroservice(optionsMicroservice)({ effects: [ack$], output$ });
    client = await Util.createAmqpClient(optionsClient);

    await client.emit({ type: 'TEST' });
    await client.emit({ type: 'ACK', payload: 1 });
  });

  test('chains events by sending back to origin channel when no reply is defined', async done => {
    // given
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

    // then
    const output$ = Util.assertOutputEvent(
      { type: 'TEST_2' },
      { type: 'TEST_3' },
    )(done);

    // when
    microservice = await Util.createAmqpMicroservice(options)({ effects: [test1$, test2$], output$ });
    client = await Util.createAmqpClient(options);

    await client.emit({ type: 'TEST_1' });
  });

  test('sends outgoing event to different channel and doesn\'t cause infinite loop', async done => {
    // given
    const options = Util.createAmqpOptions();
    const replyTo = createUuid();

    const test$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('TEST'),
        map(reply(replyTo)),
      );

    // then
    const output$ = Util.assertOutputEvent({
      type: 'TEST',
      metadata: expect.objectContaining({ replyTo }),
    })(done);

    // when
    microservice = await Util.createAmqpMicroservice(options)({ effects: [test$], output$ });
    client = await Util.createAmqpClient(options);

    await client.emit({ type: 'TEST' });
  });

  test('consumes pending messages after startup', async done => {
    // given
    const options = Util.createAmqpOptions();
    const replyTo = createUuid();

    const test$: MsgEffect = event$ =>
      event$.pipe(
        matchEvent('TEST'),
        mapTo(reply(replyTo)({ type: 'TEST_RESULT' })),
      );

    // then
    const output$ = Util.assertOutputEvent({
      type: 'TEST_RESULT',
    })(done);

    // when (order matters)
    client = await Util.createAmqpClient(options);

    await client.emit({ type: 'TEST' });

    microservice = await Util.createAmqpMicroservice(options)({ effects: [test$], output$ });
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
