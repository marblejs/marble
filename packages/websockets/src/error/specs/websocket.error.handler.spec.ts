import { EventError, EffectContext, createContext, createEffectContext, lookup } from '@marblejs/core';
import { mapTo } from 'rxjs/operators';
import { handleEffectsError } from '../websocket.error.handler';
import { MarbleWebSocketClient } from '../../websocket.interface';
import { WsErrorEffect } from '../../effects/websocket.effects.interface';

const createMockClient = (): MarbleWebSocketClient =>
  ({ sendResponse: jest.fn() }) as any;

describe('#handleEffectsError', () => {
  let ctx: EffectContext<MarbleWebSocketClient>;

  beforeEach(() => {
    ctx = createEffectContext({
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
    handleEffectsError(ctx, error$)(error);

    // then
    expect(ctx.client.sendResponse).toHaveBeenCalled();
  });

  test('does nothing if error$ is undefined', () => {
    // given
    const error = new EventError({ type: 'EVENT' }, '');
    const error$ = undefined;

    // when
    handleEffectsError(ctx, error$)(error);

    // then
    expect(ctx.client.sendResponse).not.toHaveBeenCalled();
  });
});
