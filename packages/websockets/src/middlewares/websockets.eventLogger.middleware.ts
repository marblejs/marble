import { tap } from 'rxjs/operators';
import { useContext, LoggerToken, LoggerLevel, LoggerTag } from '@marblejs/core';
import { WsMiddlewareEffect } from '../effects/websocket.effects.interface';

export const inputLogger$: WsMiddlewareEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    tap(event => {
      const id = event.metadata?.correlationId;
      const message = id ? `${event.type}, id: ${id}` : event.type;

      logger({
        message,
        type: 'EVENT_IN',
        tag: LoggerTag.WEBSOCKETS,
        level: LoggerLevel.INFO,
      })();
    }),
  );
};

export const outputLogger$: WsMiddlewareEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    tap(event => {
      const { error, metadata, type } = event;
      const message = error
        ? `"${error.name}", "${error.message}" for event ${type}`
        : metadata?.replyTo
          ? `${event.type}, id: ${metadata?.correlationId || '-'} and sent to "${metadata.replyTo || '-'}"`
          : metadata?.correlationId
            ? `${event.type}, id: ${metadata.correlationId}`
            : event.type;

      logger({
        message,
        type: 'EVENT_OUT',
        tag: LoggerTag.WEBSOCKETS,
        level: event.error ? LoggerLevel.ERROR : LoggerLevel.INFO,
      })();
    }),
  );
};

export const errorLogger$: WsMiddlewareEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    tap(event => {
      const message = `"${event.error?.name || '-'}: ${event.error?.message || '-' }" for event ${event.type}`;

      return logger({
        message,
        type: 'ERROR',
        tag: LoggerTag.WEBSOCKETS,
        level: LoggerLevel.ERROR,
      })();
    }),
  );
};
