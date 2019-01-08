import { EventError } from '@marblejs/core';
import { mapTo } from 'rxjs/operators';
import { handleEffectsError } from '../ws-error.handler';
import { MarbleWebSocketClient } from '../../websocket.interface';
import { WebSocketErrorEffect } from '../../effects/ws-effects.interface';

describe('#handleEffectsError', () => {
  test('handles error if error$ is defined', () => {
    // given
    const client = { sendResponse: jest.fn() } as any as MarbleWebSocketClient;
    const error = new EventError({ type: 'EVENT' }, '');
    const error$: WebSocketErrorEffect = event$ => event$.pipe(
      mapTo({ type: error.event.type, error: {} }),
    );

    // when
    handleEffectsError(client, error$)(error);

    // then
    expect(client.sendResponse).toHaveBeenCalled();
  });

  test('does nothing if error$ is undefined', () => {
    // given
    const client = { sendResponse: jest.fn() } as any as MarbleWebSocketClient;
    const error = new EventError({ type: 'EVENT' }, '');

    // when
    handleEffectsError(client, undefined)(error);

    // then
    expect(client.sendResponse).not.toHaveBeenCalled();
  });
});
