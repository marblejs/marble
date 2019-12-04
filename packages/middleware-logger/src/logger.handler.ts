import { HttpRequest } from '@marblejs/core';
import { fromEvent, Timestamp } from 'rxjs';
import { take, filter, mapTo, map } from 'rxjs/operators';
import { factorizeLog } from './logger.factory';
import { LoggerOptions } from './logger.model';
import { writeToStream, isNotSilent, filterResponse } from './logger.util';

export const loggerHandler = (opts: LoggerOptions) => (stamp: Timestamp<HttpRequest>) =>
  fromEvent(stamp.value.response, 'finish')
    .pipe(
      take(1),
      mapTo(stamp.value),
      map(req => ({ req, res: req.response })),
      filter(isNotSilent(opts)),
      filter(filterResponse(opts)),
    )
    .subscribe(({ res }) => {
      const { info } = console;
      const log = factorizeLog(res, stamp);
      const streamLog = log({ colorize: false, timestamp: true });
      const consoleLog = log({ colorize: true });

      opts.stream
        ? writeToStream(opts.stream, streamLog)
        : info(consoleLog);
    });
