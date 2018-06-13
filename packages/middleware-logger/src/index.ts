import { compose, Effect, HttpRequest } from '@marblejs/core';
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

export const logger$: Effect<HttpRequest> = (request$, response) =>
  request$.pipe(
    tap(request => {
      const startTime = new Date();

      response.on('finish', () =>
        printLog(
          request.method!,
          request.url!,
          getStatusCode(response.statusCode),
          compose(formatTime, getTimeDifferenceMs)(startTime)
        )
      );
    })
  );
