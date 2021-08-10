import { useContext, LoggerToken } from '@marblejs/core';
import { HttpMiddlewareEffect } from '@marblejs/http';
import { timestamp, tap, map } from 'rxjs/operators';
import { LoggerOptions } from './logger.model';
import { loggerHandler } from './logger.handler';

export const logger$ = (opts: LoggerOptions = {}): HttpMiddlewareEffect => (req$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);

  return req$.pipe(
    timestamp(),
    tap(stamp => loggerHandler(opts, logger)(stamp).subscribe()),
    map(({ value: req }) => req),
  );
};
