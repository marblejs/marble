import { tap, map } from 'rxjs/operators';
import { useContext } from '@marblejs/core';
import { provideLogger, LoggerLevel } from '../server/messaging.server.logger';
import { MsgMiddlewareEffect, MsgOutputEffect, MsgErrorEffect } from '../effects/messaging.effects.interface';
import { TransportLayerToken } from '../server/messaging.server.tokens';

export const inputLogger$: MsgMiddlewareEffect = (event$, ctx) => {
  const logger = provideLogger(ctx.ask);
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);

  return event$.pipe(
    tap(event => {
      const channel = transportLayer.config.channel;
      const message = `${event.type}, id: ${event.raw.correlationId}`;

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
    tap(({ event, initiator }) => {
      const channel = transportLayer.config.channel;
      const message = event.error
        ? `${event.error.name}, ${event.error.message} for event ${event.type}`
        : initiator.replyTo
          ? `${event.type}, id: ${initiator.correlationId} and sent to ${initiator.replyTo}`
          : `${event.type}, id: ${initiator.correlationId}`;

      logger({
        level: event.error ? LoggerLevel.ERROR : LoggerLevel.INFO,
        tag: 'EVENT_OUT',
        message,
        channel,
      });
    }),
    map(({ event }) => event),
  );
};

export const errorLogger$: MsgErrorEffect = (event$, ctx) => {
  const logger = provideLogger(ctx.ask);
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);

  return event$.pipe(
    tap(({ error, event }) => logger({
      tag: 'ERROR',
      message: event
        ? `${error.name}, ${error.message} for event ${event.type}`
        : `${error.name}, ${error.message}`,
      level: LoggerLevel.ERROR,
      channel: transportLayer.config.channel,
    })),
    map(({ event }) => event),
  );
};
