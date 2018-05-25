import { Effect, HttpRequest } from '@marblejs/core';
import chalk from 'chalk';
import { tap } from 'rxjs/operators';

const getStatusCode = (statusCode: number): string =>
  statusCode >= 400
    ? chalk.yellow(statusCode.toString())
    : chalk.green(statusCode.toString());

const getEndTime = (hrStartTime: [number, number]): number => {
  const hrEndTime = process.hrtime(hrStartTime)[1] / 1000000;
  return Math.round(hrEndTime * 100) / 100;
};

const printLog = (
  method: string,
  url: string,
  statusCode: string,
  endTime: number
) => {
  console.info(`%s %s %s %dms`, method, url, statusCode, endTime);
};

export const logger$: Effect<HttpRequest> = (request$, response) =>
  request$.pipe(
    tap(request => {
      const startTime = process.hrtime();

      response.on('finish', () =>
        printLog(
          request.method!,
          request.url!,
          getStatusCode(response.statusCode),
          getEndTime(startTime)
        )
      );
    })
  );
