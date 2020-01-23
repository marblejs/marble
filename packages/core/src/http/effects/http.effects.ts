import { tap, map } from 'rxjs/operators';
import { ServerEvent } from '../server/http.server.event';
import { matchEvent } from '../../operators/matchEvent/matchEvent.operator';
import { useContext } from '../../context/context.hook';
import { LoggerToken, LoggerTag, LoggerLevel } from '../../logger';
import { HttpServerEffect } from './http.effects.interface';

export const listening$: HttpServerEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    matchEvent(ServerEvent.listening),
    map(event => event.payload),
    tap(({ host, port }) => {
      const message = `Server running @ http://${host}:${port}/ 🚀`;
      const log = logger({ tag: LoggerTag.HTTP, level: LoggerLevel.INFO, type: 'Server', message });

      log();
    }),
  );
}

export const error$: HttpServerEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    matchEvent(ServerEvent.error),
    map(event => event.payload),
    tap(({ error }) => {
      const message = `Unexpected server error occured: "${error.name}", "${error.message}"`;
      const log = logger({ tag: LoggerTag.HTTP, level: LoggerLevel.ERROR, type: 'Server', message });

      log();
    }),
  );
}

export const close$: HttpServerEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return event$.pipe(
    matchEvent(ServerEvent.close),
    map(event => event.payload),
    tap(() => {
      const message = `Server connection was closed`;
      const log = logger({ tag: LoggerTag.HTTP, level: LoggerLevel.INFO, type: 'Server', message });

      log();
    }),
  );
}
