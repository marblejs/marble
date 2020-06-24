import { useContext, LoggerToken, LoggerTag } from '@marblejs/core';
import { tap } from 'rxjs/operators';
import * as T from 'fp-ts/lib/Task';
import { flow } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import { MsgEffect } from '../effects/messaging.effects.interface';
import { EventTimerStoreToken } from '../eventStore/eventTimerStore';
import { Transport } from '../transport/transport.interface';
import { nackEvent } from '../ack/ack';

const ACK_TRANSPORTS = [Transport.AMQP];

/**
 * Automatically tries to reject all unhandled events when `timeout` defined by the transport layer options occurs.
 * The middleware should be applied only for transports that support message acknowledgements.
 *
 * @since v3.3.0
 */
export const rejectUnhandled$: MsgEffect = (event$, ctx) => {
  const eventTimerStore = useContext(EventTimerStoreToken)(ctx.ask);
  const logger = useContext(LoggerToken)(ctx.ask);
  const timeout = ctx.client.config.timeout;

  const isAckTransport = (type: Transport) =>
    ACK_TRANSPORTS.includes(type);

  const logRejection = pipe(
    logger({
      tag: LoggerTag.MESSAGING,
      type: 'rejectUnhandled$',
      message: 'Rejecting not acknowledged event due to timeout. Check if incoming event type has a corresponding event handler defined'
    }),
    T.fromIO,
  );

  const handleEventRejection = flow(
    nackEvent(ctx),
    T.chain(() => logRejection),
  );

  return event$.pipe(
    tap(event => {
      if (isAckTransport(ctx.client.type)) {
        const handler = handleEventRejection(event);
        eventTimerStore.register(timeout)(handler)(event)();
      }
    }),
  );
};
