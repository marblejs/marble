import { tap } from 'rxjs/operators';
import { useContext } from '@marblejs/core';
import { provideLogger, LoggerLevel } from '../server/messaging.server.logger';
import { MsgMiddlewareEffect, MsgOutputEffect } from '../effects/messaging.effects.interface';
import { TransportLayerToken } from '../server/messaging.server.tokens';

export const inputLogger$: MsgMiddlewareEffect = (event$, ctx) => {
  const logger = provideLogger(ctx.ask);
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);

  return event$.pipe(
    tap(event => {
      const channel = transportLayer.config.channel;
      const message = `${event.type}, id: ${event.metadata?.correlationId}`;

      logger({
        level: LoggerLevel.INFO,
        tag: 'EVENT_IN',
        message,
        channel,
      });
    }),
  );
};

export const outputLogger$: MsgOutputEffect = (event$, ctx) => {
  const logger = provideLogger(ctx.ask);
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);

  return event$.pipe(
    tap(event => {
      const { error, metadata, type } = event;
      const channel = transportLayer.config.channel;
      const message = error
        ? `"${error.name}", "${error.message}" for event ${type}`
        : metadata?.replyTo
          ? `${event.type}, id: ${metadata?.correlationId ?? '-'} and sent to ${metadata?.replyTo ?? '-'}`
          : `${event.type}, id: ${metadata?.correlationId ?? '-'}`;

      logger({
        level: event.error ? LoggerLevel.ERROR : LoggerLevel.INFO,
        tag: 'EVENT_OUT',
        message,
        channel,
      });
    }),
  );
};

export const errorLogger$: MsgMiddlewareEffect = (event$, ctx) => {
  const logger = provideLogger(ctx.ask);
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);

  return event$.pipe(
    tap(event => logger({
      tag: 'ERROR',
      message: `"${event.error?.name ?? '-'}: ${event.error?.message ?? '-' }" for event ${event.type}`,
      level: LoggerLevel.ERROR,
      channel: transportLayer.config.channel,
    })),
  );
};
