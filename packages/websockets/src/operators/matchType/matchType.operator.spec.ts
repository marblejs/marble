import { mapTo } from 'rxjs/operators';
import { Marbles } from '@marblejs/core/dist/+internal/testing';
import { WebSocketEffect } from '../../effects/ws-effects.interface';
import { matchType } from './matchType.operator';

describe('#matchType operator', () => {
  test(`matches incoming WebSocket events`, () => {
    // given
    const event1 = { type: 'TEST_EVENT_1', payload: 1 };
    const event2 = { type: 'TEST_EVENT_2', payload: 2 };
    const event3 = { type: 'TEST_EVENT_3', payload: 3 };
    const event4 = { type: 'TEST_EVENT_4', payload: 4 };
    const outgoingEvent = { type: 'TEST_EVENT_RESULT', payload: 100 };

    // when
    const effect$: WebSocketEffect = event$ =>
      event$.pipe(
        matchType('TEST_EVENT_2', { type: 'TEST_EVENT_3' }),
        mapTo(outgoingEvent),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1, b: event2, c: event3, d: event4 }],
      ['---b-c-----', { b: outgoingEvent, c: outgoingEvent }],
    ]);
  });
});
