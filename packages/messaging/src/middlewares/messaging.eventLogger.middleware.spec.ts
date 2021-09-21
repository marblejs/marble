import {
  LoggerToken,
  LoggerLevel,
  lookup,
  bindEagerlyTo,
  createEffectContext,
  contextFactory,
  createReader,
  EffectContext,
  EventError,
} from '@marblejs/core';
import { Marbles } from '@marblejs/core/dist/+internal/testing';
import { io } from 'fp-ts/lib/IO';
import { constUndefined, pipe } from 'fp-ts/lib/function';
import { messagingListener } from '../server/messaging.server.listener';
import { EventBus } from '../eventbus/messaging.eventBus.reader';
import { inputLogger$, outputLogger$, exceptionLogger$ } from './messaging.eventLogger.middleware';

describe('inputLogger$', () => {
  let loggerMock: jest.Mock;
  let ctx: EffectContext<EventBus>;

  const provideLoggerMock = () =>
    jest.fn(io.of(constUndefined));

  const provideEventBus = async (logger: any) => pipe(
    await contextFactory(bindEagerlyTo(LoggerToken)(createReader(() => logger))),
    EventBus({ listener: messagingListener() }));

  const provideEffectContextForLogger = async (logger: any) => pipe(
    await provideEventBus(logger),
    client => createEffectContext({ ask: lookup(client.context), client }));

  beforeEach(async () => {
    loggerMock = provideLoggerMock();
    ctx = await provideEffectContextForLogger(loggerMock);
  });

  afterEach(() => {
    loggerMock.mockReset();
  });

  test('logs incoming events', async () => {
    // given - events
    const events = [
      { type: 'TEST_EVENT_TYPE_0' },
      { type: 'TEST_EVENT_TYPE_1', payload: { test: true } },
      { type: 'TEST_EVENT_TYPE_2', error: { test: true } },
    ];

    loggerMock.mockClear();

    // when, then
    Marbles.assertEffect(inputLogger$, [
      ['-012-', { 0: events[0], 1: events[1], 2: events[2] }],
      ['-012-', { 0: events[0], 1: events[1], 2: events[2] }],
    ], { ctx });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.INFO,
      message: events[0].type,
      type: 'EVENT_IN',
      tag: 'event_bus',
      data: { payload: events[0].payload },
    });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.INFO,
      message: events[1].type,
      type: 'EVENT_IN',
      tag: 'event_bus',
      data: { payload: events[1].payload },
    });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.INFO,
      message: events[2].type,
      type: 'EVENT_IN',
      tag: 'event_bus',
      data: { payload: events[2].payload },
    });
  });

  test('logs outgoing events', async () => {
    // given - events
    const events = [
      {
        type: 'TEST_EVENT_TYPE_0'
      },
      {
        type: 'TEST_EVENT_TYPE_1',
        payload: { test: true },
        metadata: { correlationId: 'some_id', replyTo: 'some_channel' },
      },
      {
        type: 'TEST_EVENT_TYPE_2',
        error: { test: true },
      },
      {
        type: 'TEST_EVENT_TYPE_3',
        error: new Error('some_error_message'),
      },
      {
        type: 'TEST_EVENT_TYPE_4',
        error: new EventError({ type: 'TEST_EVENT_TYPE_4' }, 'some_error_message', { test: true }),
      },
      {
        type: 'TEST_EVENT_TYPE_5',
        error: new EventError({ type: 'TEST_EVENT_TYPE_5' }, 'some_error_message', { test: true }),
        metadata: { correlationId: 'some_id' },
      },
    ];

    loggerMock.mockClear();

    // when, then
    Marbles.assertEffect(outputLogger$, [
      ['-012345-', { 0: events[0], 1: events[1], 2: events[2], 3: events[3], 4: events[4], 5: events[5] }],
      ['-012345-', { 0: events[0], 1: events[1], 2: events[2], 3: events[3], 4: events[4], 5: events[5] }],
    ], { ctx });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.INFO,
      message: events[0].type,
      type: 'EVENT_OUT',
      tag: 'event_bus',
      data: { payload: events[0].payload },
    });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.INFO,
      message: `${events[1].type}, id: ${events[1].metadata?.correlationId} and sent to \"${events[1].metadata?.replyTo}\"`,
      type: 'EVENT_OUT',
      tag: 'event_bus',
      data: { payload: events[1].payload },
    });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.ERROR,
      message: `Unknown error "{"test":true}" for event "${events[2].type}"`,
      type: 'EVENT_OUT',
      tag: 'event_bus',
      data: { payload: events[2].payload },
    });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.ERROR,
      message: `"Error: some_error_message" for event "${events[3].type}"`,
      type: 'EVENT_OUT',
      tag: 'event_bus',
      data: { payload: events[3].payload },
    });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.ERROR,
      message: `Received invalid event "${events[4].type}" (UNKNOWN_CORRELATION_ID) with error: {"test":true}`,
      type: 'EVENT_OUT',
      tag: 'event_bus',
      data: { payload: events[4].payload },
    });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.ERROR,
      message: `Received invalid event "${events[5].type}" (some_id) with error: {"test":true}`,
      type: 'EVENT_OUT',
      tag: 'event_bus',
      data: { payload: events[5].payload },
    });
  });

  test('logs server exceptions', async () => {
    // given - events
    const events = [
      { type: 'TEST_EVENT_TYPE_0' },
      { type: 'TEST_EVENT_TYPE_1', error: new Error('some_error_message') },
      { type: 'TEST_EVENT_TYPE_2', error: { test: true } },
    ];

    loggerMock.mockClear();

    // when, then
    Marbles.assertEffect(exceptionLogger$, [
      ['-012-', { 0: events[0], 1: events[1], 2: events[2] }],
      ['-012-', { 0: events[0], 1: events[1], 2: events[2] }],
    ], { ctx });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.ERROR,
      message: `Unknown error "undefined" for event "${events[0].type}"`,
      type: 'ERROR',
      tag: 'event_bus',
    });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.ERROR,
      message: `"Error: some_error_message" for event "${events[1].type}"`,
      type: 'ERROR',
      tag: 'event_bus',
    });

    expect(loggerMock).toHaveBeenCalledWith({
      level: LoggerLevel.ERROR,
      message: `Unknown error "{"test":true}" for event "${events[2].type}"`,
      type: 'ERROR',
      tag: 'event_bus',
    });
  });
});
