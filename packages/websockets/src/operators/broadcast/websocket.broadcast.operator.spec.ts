import { Marbles } from '@marblejs/core/dist/+internal';
import { of } from 'rxjs';
import { WsEffect } from '../../effects/websocket.effects.interface';
import { broadcast } from './websocket.broadcast.operator';

describe('#broadcast operator', () => {
  const client = { sendBroadcastResponse: jest.fn(() => of(true)) };
  const ctx = { client };

  test('sends broadcast response', () => {
    // given
    const incomingEvent = { type: 'TEST_EVENT' };
    const outgoingEvent = { type: 'TEST_EVENT_RESPONSE', payload: 'test_payload' };

    // when
    const effect$: WsEffect = (event$, { client }) =>
      event$.pipe(
        broadcast(client, () => outgoingEvent),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a--', { a: incomingEvent }],
      ['-b--', { b: outgoingEvent }],
    ], { ctx });

    expect(client.sendBroadcastResponse).toHaveBeenCalledWith(outgoingEvent);
  });
});
