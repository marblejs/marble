import chalk from 'chalk';
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
      const eventType = chalk.yellow(event.type);
      const eventCorrelationId = chalk.magenta(event.raw.correlationId);
      const channel = transportLayer.config.channel;
      const message = `${eventType}, id: ${eventCorrelationId}`;

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
      const eventType = chalk.yellow(event.type);
      const eventCorrelationId = initiator.correlationId && chalk.magenta(initiator.correlationId);
      const eventReplyTo = initiator.replyTo && chalk.yellow(initiator.replyTo);
      const channel = transportLayer.config.channel;
      const message = eventReplyTo
        ? `${eventType}, id: ${eventCorrelationId} and sent to ${eventReplyTo}`
        : `${eventType}, id: ${eventCorrelationId}`;

      logger({
        level: LoggerLevel.INFO,
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
      message: chalk.red(event
        ? `${error.name}, ${error.message} for event ${event.type}`
        : `${error.name}, ${error.message}`),
      level: LoggerLevel.ERROR,
      channel: transportLayer.config.channel,
    })),
  );
};
