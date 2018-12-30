import { Marbles } from '@marblejs/core/dist/+internal';
import { error$ } from '../ws-error.effect';
import { WebSocketError } from '../ws-error.model';

describe('error$', () => {
  test('returns stream of error events for defined error object', () => {
    // given
    const incomingEvent = { type: 'TEST_EVENT' };
    const error = new WebSocketError(incomingEvent, 'Test error message', { errorData: 'test_error_data' });
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
});
