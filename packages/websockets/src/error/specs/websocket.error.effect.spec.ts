import { Marbles } from '@marblejs/core/dist/+internal/testing';
import { defaultError$ } from '../websocket.error.effect';

describe('defaultError$', () => {
  test('returns stream of error events for defined error object', () => {
    // given
    const error = new Error('Test error message');
    const outgoingEvent = {
      type: 'UNHANDLED_ERROR',
      error: {
        name: error.name,
        message: error.message,
      },
    };

    // then
    Marbles.assertEffect(defaultError$, [
      ['--a--', { a: error }],
      ['--b--', { b: outgoingEvent }],
    ]);
  });

  test('returns stream of error events for undefined error object', () => {
    // given
    const error = undefined;
    const outgoingEvent = {
      type: 'UNHANDLED_ERROR',
      error: {},
    };

    // then
    Marbles.assertEffect(defaultError$, [
      ['--a--', { a: error }],
      ['--b--', { b: outgoingEvent }],
    ]);
  });
});
