import { createEffectContext, contextFactory, lookup, Event, bindTo } from '@marblejs/core';
import { TransportLayerConnection } from '../transport/transport.interface';
import { EventTimerStoreToken, EventTimerStore } from '../eventStore/eventTimerStore';
import { ackEvent, nackEvent, nackAndResendEvent } from './ack';

const prepareEffectContext = async () => {
  const ctx = await contextFactory(bindTo(EventTimerStoreToken)(EventTimerStore));
  const ask = lookup(ctx);
  const client = {
    ackMessage: jest.fn(),
    nackMessage: jest.fn(),
  } as unknown as TransportLayerConnection;

  return createEffectContext({ ask, client });
};

describe('#ackEvent, #nackEvent, #nackAndRequeueEvent', () => {
  test('handles event with empty metadata', async () => {
    // given
    const ctx = await prepareEffectContext();
    const event: Event = { type: 'TEST' };

    // when
    const result = Promise.all([
      ackEvent(ctx)(event)(),
      nackEvent(ctx)(event)(),
      nackAndResendEvent(ctx)(event)(),
    ]);

    expect(result).resolves.toEqual([true, true, true]);
  });

  test('handles event with metadata defined', async () => {
    // given
    const ctx = await prepareEffectContext();
    const event: Event = { type: 'TEST', metadata: { correlationId: '123', raw: {} } };

    // when
    const result = Promise.all([
      ackEvent(ctx)(event)(),
      nackEvent(ctx)(event)(),
      nackAndResendEvent(ctx)(event)(),
    ]);

    expect(result).resolves.toEqual([true, true, true]);
  });
});
