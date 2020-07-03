import { Event, useContext } from '@marblejs/core';
import { createUuid, isNonNullable, encodeError } from '@marblejs/core/dist/+internal/utils';
import { map } from 'rxjs/operators';
import { MsgOutputEffect } from '../effects/messaging.effects.interface';
import { TransportLayerToken } from '../server/messaging.server.tokens';

export const outputRouter$: MsgOutputEffect = (event$, ctx) => {
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);
  const originChannel = transportLayer.config.channel;

  return event$.pipe(
    map(event => ({
      ...event,
      metadata: {
        ...event.metadata,
        correlationId: event.metadata?.correlationId ?? createUuid(),
        replyTo: event.metadata?.replyTo ?? originChannel
      },
    }))
  );
};

export const outputErrorEncoder$: MsgOutputEffect<Event<any>> = event$ =>
  event$.pipe(
    map(event => {
      const { payload: { error: payloadError } = { error: undefined }, error } = event;

      if (isNonNullable(error)) {
        event.error = encodeError(error);
      }

      if (isNonNullable(payloadError)) {
        event.payload.error = encodeError(payloadError);
      }

      return event;
    }),
  );
