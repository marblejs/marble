import { EventError, EffectMetadata, createContext, createEffectMetadata, lookup } from '@marblejs/core';
import { mapTo } from 'rxjs/operators';
import { handleEffectsError } from '../ws-error.handler';
import { MarbleWebSocketClient } from '../../websocket.interface';
import { WsErrorEffect } from '../../effects/ws-effects.interface';

describe('#handleEffectsError', () => {
  let defaultMetadata: EffectMetadata;

  beforeEach(() => {
    defaultMetadata = createEffectMetadata({ ask: lookup(createContext()) });
  });

  test('handles error if error$ is defined', () => {
    // given
    const client = { sendResponse: jest.fn() } as any as MarbleWebSocketClient;
    const error = new EventError({ type: 'EVENT' }, '');
    const error$: WsErrorEffect = event$ => event$.pipe(
      mapTo({ type: error.event.type, error: {} }),
    );

    // when
    handleEffectsError(defaultMetadata, client, error$)(error);

    // then
    expect(client.sendResponse).toHaveBeenCalled();
  });

  test('does nothing if error$ is undefined', () => {
    // given
    const client = { sendResponse: jest.fn() } as any as MarbleWebSocketClient;
    const error = new EventError({ type: 'EVENT' }, '');

    // when
    handleEffectsError(defaultMetadata, client, undefined)(error);

    // then
    expect(client.sendResponse).not.toHaveBeenCalled();
  });
});
