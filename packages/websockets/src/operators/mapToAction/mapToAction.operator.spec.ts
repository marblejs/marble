import { Marbles } from '@marblejs/core/dist/+internal';
import { mapToAction } from './mapToAction.operator';
import { WebSocketEffect } from '../../effects/ws-effects.interface';

describe('#mapToAction operator', () => {
  test('factorizes WebSocket response', () => {
    // given
    const incomingEvent = { type: 'TEST_EVENT' };
    const outgoingEvent = { type: 'TEST_EVENT', payload: 'test_payload' };

    // when
    const effect$: WebSocketEffect = event$ =>
      event$.pipe(
        mapToAction((event, creator) => creator
          .type(event.type)
          .payload('test_payload'),
        ),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['--a--', { a: incomingEvent }],
      ['--b--', { b: outgoingEvent }],
    ]);
  });
});
