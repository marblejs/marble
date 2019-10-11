import { HttpMiddlewareEffect } from '@marblejs/core';
import { timestamp, tap, map } from 'rxjs/operators';
import { LoggerOptions } from './logger.model';
import { loggerHandler } from './logger.handler';

export const logger$ = (opts: LoggerOptions = {}): HttpMiddlewareEffect => (req$, ctx) =>
  req$.pipe(
    timestamp(),
    tap(loggerHandler(ctx.client, opts)),
    map(({ value: req }) => req),
  );

/**
 * @deprecated [#1] since version 2.0,
 * [#2] will be deleted in version 3.0,
 * [#3] use logger$ instead,
 */
export const loggerWithOpts$ = (opts: LoggerOptions = {}): HttpMiddlewareEffect => (req$, ctx) => {
  console.warn('Deprecation warning: loggerWithOpts$ is deprecated since v2.0 and will be removed in v3.0. Use logger$ instead.');
  return logger$(opts)(req$, ctx);
};
