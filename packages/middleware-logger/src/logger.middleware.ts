import { HttpMiddlewareEffect } from '@marblejs/core';
import { timestamp, tap, map } from 'rxjs/operators';
import { LoggerOptions } from './logger.model';
import { loggerHandler } from './logger.handler';

/**
 * @deprecated [#1] since version 1.2,
 * [#2] will be deleted in version 2.0,
 * [#3] use loggerWithOpts$ instead,
 */
export const logger$: HttpMiddlewareEffect = (req$, res, injector) => {
  // tslint:disable-next-line:max-line-length
  console.warn('Deprecation warning: logger$ is deprecated since v1.2 and will be removed in v2.0. Use loggerWithOpts$ instead.');
  return loggerWithOpts$()(req$, res, injector);
};

export const loggerWithOpts$ = (opts: LoggerOptions = {}): HttpMiddlewareEffect => (req$, res) =>
  req$.pipe(
    timestamp(),
    tap(loggerHandler(res, opts)),
    map(({ value: req }) => req),
  );
