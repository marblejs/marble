import chalk from 'chalk';
import { matchEvent, useContext, combineEffects } from '@marblejs/core';
import { distinctUntilChanged, tap, map, filter } from 'rxjs/operators';
import { Transport} from '../transport/transport.interface';
import { RedisConnectionStatus } from '../transport/strategies/redis.strategy.interface';
import { AmqpConnectionStatus } from '../transport/strategies/amqp.strategy.interface';
import { TransportLayerToken } from './messaging.server.tokens';
import { ServerEvent } from './messaging.server.events';
import { MsgServerEffect, MsgMiddlewareEffect, MsgOutputEffect } from '../effects/messaging.effects.interface';

type Logger = (msg: string) => any;
type LogFn = (logger: Logger) => (type: string) => (msg: string) => any;

const BRANDING = '@marblejs/messaging';

const provideLogger = (customLogger?: Logger) =>
  customLogger || console.log;

const log: LogFn = logger => type => msg => {
  const now = new Date().toISOString();
  return logger(`${now}\t${BRANDING}\t${type}\t${msg}`);
};

const logInfo: LogFn = logger => type => msg => log(logger)(chalk.green(type))(msg);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logWarn: LogFn = logger => type => msg => log(logger)(chalk.yellow(type))(msg);

const logError: LogFn = logger => type => msg => log(logger)(chalk.red(type))(msg);

// log server connected/disconnected status
export const status$ = (customLogger?: Logger) => {
  const logger = provideLogger(customLogger);

  const serverStatusMap = {
    connect: {
      [Transport.AMQP]: AmqpConnectionStatus.CONNECTED,
      [Transport.REDIS]: RedisConnectionStatus.CONNECT,
    },
    disconnect: {
      [Transport.AMQP]: AmqpConnectionStatus.CONNECTION_LOST,
      [Transport.REDIS]: RedisConnectionStatus.RECONNECTING,
    },
  }

  const connect$ = (logger: Logger): MsgServerEffect => (event$, ctx) =>
    event$.pipe(
      matchEvent(ServerEvent.status),
      map(event => event.payload),
      distinctUntilChanged((p, c) => p.type === c.type),
      filter(({ type }) => {
        const transportLayer = useContext(TransportLayerToken)(ctx.ask);
        return type === serverStatusMap.connect[transportLayer.type];
      }),
      tap(({ host, channel }) =>
        logInfo(logger)('CONNECTED')(`${chalk.yellow(host)} on channel ${chalk.yellow(channel)}`)),
    );

  const disconnect$ = (logger: Logger): MsgServerEffect => (event$, ctx) =>
    event$.pipe(
      matchEvent(ServerEvent.status),
      map(event => event.payload),
      distinctUntilChanged((p, c) => p.type === c.type),
      filter(({ type }) => {
        const transportLayer = useContext(TransportLayerToken)(ctx.ask);
        return type === serverStatusMap.disconnect[transportLayer.type];
      }),
      tap(({ host, channel }) =>
        logError(logger)('DISCONNECTED')(`${chalk.yellow(host)} on channel ${chalk.yellow(channel)}`)),
    );

  return combineEffects(
    connect$(logger),
    disconnect$(logger),
  );
};

// log listener incoming messages
export const input$ = (customLogger?: Logger): MsgMiddlewareEffect => {
  const logger = provideLogger(customLogger);

  return event$ =>
    event$.pipe(
      tap(event => {
        const eventType = chalk.yellow(event.type);
        const eventCorrelationId = chalk.magenta(event.raw.correlationId);
        return logInfo(logger)('EVENT_IN')(`${eventType}, id: ${eventCorrelationId}`);
      }),
    );
};

// log listener server outgoing messages
export const output$ = (customLogger?: Logger): MsgOutputEffect => {
  const logger = provideLogger(customLogger);

  return event$ =>
    event$.pipe(
      tap(({ event, initiator }) => {
        const eventType = chalk.yellow(event.type);
        const eventCorrelationId = initiator.correlationId && chalk.magenta(initiator.correlationId);
        const eventReplyTo = initiator.replyTo && chalk.yellow(initiator.replyTo);

        return eventReplyTo
          ? logInfo(logger)('EVENT_OUT')(`${eventType}, id: ${eventCorrelationId} and sent to ${eventReplyTo}`)
          : logInfo(logger)('EVENT_OUT')(`${eventType}, id: ${eventCorrelationId}`);
      }),
      map(({ event }) => event),
    );
};
