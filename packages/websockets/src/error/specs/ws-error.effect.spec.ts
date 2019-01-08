import { EventError } from '@marblejs/core';
import { Marbles } from '@marblejs/core/dist/+internal';
import { error$ } from '../ws-error.effect';

describe('error$', () => {
  test('returns stream of error events for defined error object', () => {
    // given
    const incomingEvent = { type: 'TEST_EVENT' };
    const error = new EventError(incomingEvent, 'Test error message', { errorData: 'test_error_data' });
    const outgoingEvent = {
      type: incomingEvent.type,
      error: {
        message: error.message,
        data: error.data,
      },
    };

    // then
    Marbles.assertEffect(error$, [
      ['--a--', { a: incomingEvent }],
      ['--b--', { b: outgoingEvent }],
    ], { meta: error });
  });

  test('returns stream of error events for undefined error object', () => {
    // given
    const incomingEvent = { type: 'TEST_EVENT' };
    const error = undefined;
    const outgoingEvent = { type: incomingEvent.type, error: {} };

    // then
    Marbles.assertEffect(error$, [
      ['--a--', { a: incomingEvent }],
      ['--b--', { b: outgoingEvent }],
    ], { meta: error });
  });

  test('returns stream of error events for undefined event object', () => {
    // given
    const incomingEvent = undefined;
    const error = undefined;
    const outgoingEvent = { type: 'ERROR', error: {} };

    // then
    Marbles.assertEffect(error$, [
      ['--a--', { a: incomingEvent }],
      ['--b--', { b: outgoingEvent }],
    ], { meta: error });
  });
});
