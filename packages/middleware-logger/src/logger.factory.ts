import { HttpRequest, HttpResponse } from '@marblejs/core';
import { Timestamp } from 'rxjs';
import chalk from 'chalk';
import { factorizeTime } from './time.factory';

type LogFactorizerOptions = {
  colorize?: boolean;
  timestamp?: boolean;
};

const colorizeStatusCode = (statusCode: number): string =>
  statusCode >= 400
    ? chalk.yellow(statusCode.toString())
    : chalk.green(statusCode.toString());

export const factorizeLog =
  (res: HttpResponse, stamp: Timestamp<HttpRequest>) =>
  (opts: LogFactorizerOptions = {}) => {
    const { method, url } = stamp.value;

    const timestamp = opts.timestamp
      ? new Date().toISOString()
      : '';

    const statusCode = opts.colorize
      ? colorizeStatusCode(res.statusCode)
      : String(res.statusCode);

    const time = factorizeTime(stamp.timestamp);

    return prepareLogString({ timestamp, method, url, statusCode, time });
  };

export const prepareLogString = (opts: {
  timestamp?: string;
  method: string;
  url: string;
  statusCode: string;
  time: string;
}) =>
  !!opts.timestamp
    ? `${opts.timestamp} ${opts.method} ${opts.url} ${opts.statusCode} ${opts.time}`
    : `${opts.method} ${opts.url} ${opts.statusCode} ${opts.time}`;
