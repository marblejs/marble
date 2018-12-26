import { Marbles } from '@marblejs/core/dist/+internal';
import { EMPTY } from 'rxjs';
import { broadcast } from './broadcast.operator';
import { WebSocketEffect } from '../../effects/ws-effects.interface';

describe('#broadcast operator', () => {
  const client = { sendBroadcastResponse: jest.fn(() => EMPTY) };

  test('sends broadcast response', () => {
    // given
    const incomingEvent = { type: 'TEST_EVENT' };
    const outgoingEvent = { type: 'TEST_EVENT_RESPONSE', payload: 'test_payload' };

    // when
    const effect$: WebSocketEffect = (event$, client) =>
      event$.pipe(
        broadcast(client, () => outgoingEvent),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a--', { a: incomingEvent }],
      ['----', {}],
    ], { client });

    expect(client.sendBroadcastResponse).toHaveBeenCalledWith(outgoingEvent);
  });
});
