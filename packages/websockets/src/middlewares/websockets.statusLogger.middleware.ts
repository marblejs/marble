import { matchEvent, useContext, combineEffects, LoggerToken, LoggerLevel, LoggerTag } from '@marblejs/core';
import { map, tap } from 'rxjs/operators';
import { WsServerEffect } from '../effects/websocket.effects.interface';
import { ServerEvent } from '../server/websocket.server.event';

const connection$: WsServerEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    matchEvent(ServerEvent.connection),
    map(event => event.payload),
    tap(({ client }) => logger({
      type: 'Server',
      message: `Connected incoming client "${client.id}" (${client.address})`,
      level: LoggerLevel.INFO,
      tag: LoggerTag.WEBSOCKETS,
    })()),
  );
};

const listening$: WsServerEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    matchEvent(ServerEvent.listening),
    map(event => event.payload),
    tap(({ host, port }) => logger({
      type: 'Server',
      message: `WebSocket server running @ http://${host}:${port}/ 🚀`,
      level: LoggerLevel.INFO,
      tag: LoggerTag.WEBSOCKETS,
    })())
  );
};

const close$: WsServerEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    matchEvent(ServerEvent.close),
    tap(() => logger({
      type: 'Server',
      message: 'Server connection was closed',
      level: LoggerLevel.INFO,
      tag: LoggerTag.WEBSOCKETS,
    })())
  );
};

const closeClient$: WsServerEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    matchEvent(ServerEvent.closeClient),
    map(event => event.payload),
    tap(({ client }) => logger({
      type: 'Server',
      message: `Closed connection form client "${client.id}" (${client.address})`,
      level: LoggerLevel.INFO,
      tag: LoggerTag.WEBSOCKETS,
    })())
  );
};

const error$: WsServerEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    matchEvent(ServerEvent.error),
    map(event => event.payload),
    tap(({ error }) => logger({
      type: 'Server',
      message: `Unexpected error occured: "${error.name}", "${error.message}"`,
      level: LoggerLevel.ERROR,
      tag: LoggerTag.WEBSOCKETS,
    })())
  );
};

export const statusLogger$ = combineEffects(
  connection$,
  listening$,
  error$,
  close$,
  closeClient$,
);
