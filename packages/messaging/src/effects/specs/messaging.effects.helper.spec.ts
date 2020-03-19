import { Event, EventMetadata } from '@marblejs/core';
import { reply, MissingEventTypeError, UNKNOWN_TAG } from '../messaging.effects.helper';

describe('#reply', () => {
  test('creates success response based on originated event', () => {
    // given
    const origin: Event = {
      type: 'TEST',
      metadata: { correlationId: '#123', replyTo: 'test_channel' },
    };

    // when
    const response = reply(origin)({
      type: 'TEST_RESPONSE',
      payload: 'payload',
    });

    // then
    expect(response).toEqual({
      type: 'TEST_RESPONSE',
      payload: 'payload',
      metadata: origin.metadata,
    });
  });

  test('creates error response based on originated event', () => {
    // given
    const origin: Event = {
      type: 'TEST',
      metadata: { correlationId: '#123', replyTo: 'test_channel' },
    };

    // when
    const response = reply(origin)({
      type: 'TEST_RESPONSE',
      error: 'error',
    });

    // then
    expect(response).toEqual({
      type: 'TEST_RESPONSE',
      error: 'error',
      metadata: origin.metadata,
    });
  });

  test('creates response based on provided metadata', () => {
    // given
    const metadata: EventMetadata = {
      correlationId: '#123',
      replyTo: 'test_channel',
    };

    // when
    const response = reply(metadata)({
      type: 'TEST_RESPONSE',
      payload: 'payload',
    });

    // then
    expect(response).toEqual({
      type: 'TEST_RESPONSE',
      payload: 'payload',
      metadata,
    });
  });

  test('creates response based on provided channel', () => {
    // given
    const replyTo = 'test_channel';

    // when
    const response = reply(replyTo)({
      type: 'TEST_RESPONSE',
      payload: 'payload',
    });

    // then
    expect(response).toEqual({
      type: 'TEST_RESPONSE',
      payload: 'payload',
      metadata: {
        replyTo,
      },
    });
  });

  test(`creates response and applies ${UNKNOWN_TAG} to "replyTo" attribute if incoming event routing metadata is undefined`, () => {
    // given
    const origin: Event = {
      type: 'TEST',
      metadata: {},
    };

    // when
    const response = reply(origin)({
      type: 'TEST_RESPONSE',
    });

    // then
    expect(response).toEqual({
      type: 'TEST_RESPONSE',
      metadata: { replyTo: '_UNKNOWN_' },
    });
  });

  test('throws an error if event type is not provided in reply object', () => {
    // given
    const origin: Event = {
      type: 'TEST',
      metadata: { correlationId: '#123', replyTo: 'test_channel' },
    };

    // when
    const response = () => reply(origin)({
      payload: 'payload',
    } as any);

    // then
    expect(response).toThrowError(MissingEventTypeError);
  });
});
