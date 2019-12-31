import { EventError } from '@marblejs/core';
import { Marbles } from '@marblejs/core/dist/+internal';
import { error$ } from '../websocket.error.effect';

describe('error$', () => {
  test('returns stream of error events for defined error object', () => {
    // given
    const event = { type: 'TEST_EVENT' };
    const error = new EventError(event, 'Test error message', { errorData: 'test_error_data' });
    const incomingEvent = { event, error };
    const outgoingEvent = {
      type: event.type,
      error: {
        message: error.message,
        data: error.data,
      },
    };

    // then
    Marbles.assertEffect(error$, [
      ['--a--', { a: incomingEvent }],
      ['--b--', { b: outgoingEvent }],
    ]);
  });

  test('returns stream of error events for undefined error object', () => {
    // given
    const event = { type: 'TEST_EVENT' };
    const error = undefined;
    const incomingEvent = { event, error };
    const outgoingEvent = { type: event.type, error: {} };

    // then
    Marbles.assertEffect(error$, [
      ['--a--', { a: incomingEvent }],
      ['--b--', { b: outgoingEvent }],
    ]);
  });

  test('returns stream of error events for undefined event object', () => {
    // given
    const error = undefined;
    const event = undefined;
    const incomingEvent = { event, error };
    const outgoingEvent = { type: 'ERROR', error: {} };

    // then
    Marbles.assertEffect(error$, [
      ['--a--', { a: incomingEvent }],
      ['--b--', { b: outgoingEvent }],
    ]);
  });
});
