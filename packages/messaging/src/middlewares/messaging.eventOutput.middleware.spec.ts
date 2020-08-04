import { Marbles } from '@marblejs/core/dist/+internal/testing';
import { outputErrorEncoder$ } from './messaging.eventOutput.middleware';

describe('outputErrorEncoder$', () => {
  test('encodes event with error', () => {
    // given
    const incomingError = new Error('some_message');
    const outgoingError = { name: 'Error', message: 'some_message' };

    const event_1 = [
      { type: 'TEST', payload: { error: incomingError } },
      { type: 'TEST', payload: { error: outgoingError } },
    ] as const;

    const event_2 = [
      { type: 'TEST', error: incomingError },
      { type: 'TEST', error: outgoingError },
    ] as const;

    const event_3 = [
      { type: 'TEST', payload: { error: incomingError }, error: incomingError },
      { type: 'TEST', payload: { error: outgoingError }, error: outgoingError },
    ] as const;

    // when, then
    Marbles.assertEffect(outputErrorEncoder$, [
      ['-a-b-c-', { a: event_1[0], b: event_2[0], c: event_3[0] }],
      ['-a-b-c-', { a: event_1[1], b: event_2[1], c: event_3[1] }],
    ]);
  });

  test('skips event error encoding if error is nullable', () => {
    // given
    const event_1 = [
      { type: 'TEST', payload: null },
      { type: 'TEST', payload: null },
    ] as const;

    const event_2 = [
      { type: 'TEST', payload: { error: null } },
      { type: 'TEST', payload: { error: null } },
    ] as const;

    const event_3 = [
      { type: 'TEST', error: null },
      { type: 'TEST', error: null },
    ] as const;

    // when, then
    Marbles.assertEffect(outputErrorEncoder$, [
      ['-a-b-c-', { a: event_1[0], b: event_2[0], c: event_3[0] }],
      ['-a-b-c-', { a: event_1[1], b: event_2[1], c: event_3[1] }],
    ]);
  });
});
