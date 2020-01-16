import { HttpRequest, Logger, LoggerTag, LoggerLevel } from '@marblejs/core';
import { fromEvent, Timestamp, Observable } from 'rxjs';
import { take, filter, mapTo, map, tap } from 'rxjs/operators';
import { factorizeLog } from './logger.factory';
import { LoggerOptions } from './logger.model';
import { isNotSilent, filterResponse } from './logger.util';

export const loggerHandler = (opts: LoggerOptions, logger: Logger) => (stamp: Timestamp<HttpRequest>): Observable<string> => {
  const req = stamp.value;
  const res = req.response;

  return fromEvent(res, 'finish').pipe(
    take(1),
    mapTo(req),
    filter(isNotSilent(opts)),
    filter(filterResponse(opts)),
    map(factorizeLog(stamp)),
    tap(message => {
      const level = res.statusCode >= 500
        ? LoggerLevel.ERROR
        : res.statusCode >= 400
          ? LoggerLevel.WARN
          : LoggerLevel.INFO;

      const log = logger({ tag: LoggerTag.HTTP, type: 'RequestLogger', message, level });
      return log();
    })
  );
}
