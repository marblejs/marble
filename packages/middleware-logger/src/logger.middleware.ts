import { Middleware, HttpRequest, HttpResponse } from '@marblejs/core';
import { Maybe } from '@marblejs/core/dist/+internal';
import { WriteStream } from 'fs';
import { fromEvent, Timestamp } from 'rxjs';
import { timestamp, tap, map, take, filter, mapTo } from 'rxjs/operators';
import { factorizeLog } from './logger.factory';

export interface LoggerOptions {
  silent?: boolean;
  stream?: WriteStream;
  filter?: (req: HttpRequest) => boolean;
}

const isNotSilent = (opts: LoggerOptions) => () =>
  !opts.silent;

const isRequest = (opts: LoggerOptions) => ({ value: req }: Timestamp<HttpRequest>) =>
  Maybe.of(opts.filter)
    .map(filter => filter(req))
    .valueOr(true);

const writeToStream = (stream: WriteStream, chunk: string) => {
  stream.write(`${chunk}\n\n`);
};

const handleFinishEvent = (res: HttpResponse, opts: LoggerOptions) => (stamp: Timestamp<HttpRequest>) =>
  fromEvent(res, 'finish')
    .pipe(
      take(1),
      mapTo(stamp),
      filter(isNotSilent(opts)),
      filter(isRequest(opts)),
    )
    .subscribe(stamp => {
      const log = factorizeLog(res, stamp);
      const fileLog = log({ colorize: false, timestamp: true });
      const consoleLog = log({ colorize: true });

      if (opts.stream) { writeToStream(opts.stream, fileLog); }

      console.info(consoleLog);
    });

/**
 * @deprecated [#1] since version 1.1,
 * [#2] will be deleted in version 2.0,
 * [#3] use loggerWithOpts$ instead,
 */
export const logger$: Middleware = (req$, res) => {
  // tslint:disable-next-line:max-line-length
  console.warn('Deprecation warning: logger$ is deprecated since v1.1 and will be removed in v2.0. Use loggerWithOpts$ instead.');
  return loggerWithOpts$()(req$, res, null);
};

export const loggerWithOpts$ = (opts: LoggerOptions = {}): Middleware => (req$, res) =>
  req$.pipe(
    timestamp(),
    tap(handleFinishEvent(res, opts)),
    map(({ value: req }) => req),
  );
