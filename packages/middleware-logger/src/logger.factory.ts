import chalk from 'chalk';
import { Timestamp } from 'rxjs';
import { HttpRequest, HttpResponse } from '@marblejs/core';
import { factorizeTime } from './logger.util';
import { LogParams } from './logger.model';

type LogFactorizerOptions = {
  colorize?: boolean;
  timestamp?: boolean;
};

const colorizeStatusCode = (statusCode: number): string =>
  statusCode >= 400
    ? chalk.yellow(statusCode.toString())
    : chalk.green(statusCode.toString());

export const prepareLogString = (opts: LogParams) =>
  !!opts.timestamp
    ? `${opts.timestamp} ${opts.method} ${opts.url} ${opts.statusCode} ${opts.time}`
    : `${opts.method} ${opts.url} ${opts.statusCode} ${opts.time}`;

export const factorizeLog =
  (res: HttpResponse, stamp: Timestamp<HttpRequest>) => (opts: LogFactorizerOptions = {}) => {
    const { method, url } = stamp.value;
    const now = Date.now();

    const timestamp = opts.timestamp
      ? new Date(now).toISOString()
      : '';

    const statusCode = opts.colorize
      ? colorizeStatusCode(res.statusCode)
      : String(res.statusCode);

    const time = factorizeTime(stamp.timestamp);

    return prepareLogString({ timestamp, method, url, statusCode, time });
  };
