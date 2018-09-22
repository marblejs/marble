import { Middleware } from '@marblejs/core';
import { compose } from '@marblejs/core/dist/+internal';
import chalk from 'chalk';
import { tap } from 'rxjs/operators';
import { formatTime, getTimeDifferenceMs } from './time.factory';

const getStatusCode = (statusCode: number): string =>
  statusCode >= 400
    ? chalk.yellow(statusCode.toString())
    : chalk.green(statusCode.toString());

const printLog = (
  method: string,
  url: string,
  statusCode: string,
  formattedTime: string
) => {
  console.info(`%s %s %s %s`, method, url, statusCode, formattedTime);
};

export const logger$: Middleware = (req$, res) =>
  req$.pipe(
    tap(req => {
      const startTime = new Date();

      res.on('finish', () =>
        printLog(
          req.method,
          req.url,
          getStatusCode(res.statusCode),
          compose(formatTime, getTimeDifferenceMs)(startTime)
        )
      );
    })
  );
