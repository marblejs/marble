import { useContext } from '@marblejs/core';
import { tap } from 'rxjs/operators';
import { MsgEffect } from '../effects/messaging.effects.interface';
import { EventTimerStoreToken } from '../eventStore/eventTimerStore';
import { Transport } from '../transport/transport.interface';
import { nackEvent } from '../ack/ack';

const ACK_TRANSPORTS = [Transport.AMQP];

export const rejectUnhandled$: MsgEffect = (event$, ctx) => {
  const eventTimerStore = useContext(EventTimerStoreToken)(ctx.ask);
  const isAckTransport = ACK_TRANSPORTS.includes(ctx.client.type);
  const timeout = ctx.client.config.timeout;

  return event$.pipe(
    tap(event => {
      if (isAckTransport) {
        const handler = nackEvent(ctx)(event);
        eventTimerStore.register(timeout)(handler)(event)();
      }
    }),
  );
};
