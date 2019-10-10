import { EventError, EffectMetadata, createContext, createEffectMetadata, lookup } from '@marblejs/core';
import { mapTo } from 'rxjs/operators';
import { handleEffectsError } from '../ws-error.handler';
import { MarbleWebSocketClient } from '../../websocket.interface';
import { WsErrorEffect } from '../../effects/ws-effects.interface';

const createMockClient = (): MarbleWebSocketClient =>
  ({ sendResponse: jest.fn() }) as any;

describe('#handleEffectsError', () => {
  let metadata: EffectMetadata<MarbleWebSocketClient>;

  beforeEach(() => {
    metadata = createEffectMetadata({
      ask: lookup(createContext()),
      client: createMockClient(),
    });
  });

  test('handles error if error$ is defined', () => {
    // given
    const error = new EventError({ type: 'EVENT' }, '');
    const error$: WsErrorEffect = event$ =>
      event$.pipe(
        mapTo({ type: error.event.type, error: {} }),
      );

    // when
    handleEffectsError(metadata, error$)(error);

    // then
    expect(metadata.client.sendResponse).toHaveBeenCalled();
  });

  test('does nothing if error$ is undefined', () => {
    // given
    const error = new EventError({ type: 'EVENT' }, '');
    const error$ = undefined;

    // when
    handleEffectsError(metadata, error$)(error);

    // then
    expect(metadata.client.sendResponse).not.toHaveBeenCalled();
  });
});
