import { tap } from 'rxjs/operators';
import { useContext, LoggerToken, LoggerLevel } from '@marblejs/core';
import { MsgMiddlewareEffect, MsgOutputEffect } from '../effects/messaging.effects.interface';
import { TransportLayerToken } from '../server/messaging.server.tokens';

export const inputLogger$: MsgMiddlewareEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);

  return event$.pipe(
    tap(event => {
      const tag = transportLayer.config.channel;
      const message = `${event.type}, id: ${event.metadata?.correlationId}`;

      logger({
        tag,
        message,
        type: 'EVENT_IN',
        level: LoggerLevel.INFO,
      })();
    }),
  );
};

export const outputLogger$: MsgOutputEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);

  return event$.pipe(
    tap(event => {
      const { error, metadata, type } = event;
      const tag = transportLayer.config.channel;
      const message = error
        ? `"${error.name}", "${error.message}" for event ${type}`
        : metadata?.replyTo
          ? `${event.type}, id: ${metadata?.correlationId ?? '-'} and sent to ${metadata?.replyTo ?? '-'}`
          : `${event.type}, id: ${metadata?.correlationId ?? '-'}`;

      logger({
        tag,
        message,
        level: event.error ? LoggerLevel.ERROR : LoggerLevel.INFO,
        type: 'EVENT_OUT',
      })();
    }),
  );
};

export const errorLogger$: MsgMiddlewareEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);
  const tag = transportLayer.config.channel;

  return event$.pipe(
    tap(event => {
      const message = `"${event.error?.name ?? '-'}: ${event.error?.message ?? '-' }" for event ${event.type}`;

      return logger({
        tag,
        message,
        type: 'ERROR',
        level: LoggerLevel.ERROR,
      })();
    }),
  );
};
