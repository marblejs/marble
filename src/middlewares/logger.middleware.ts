import chalk from 'chalk';
import { tap } from 'rxjs/operators';
import { HttpRequest } from '../http.interface';
import { Effect } from '../effects/effects.interface';

const getStatusCode = (statusCode: number): string =>
  statusCode >= 400
    ? chalk.red(statusCode.toString())
    : chalk.green(statusCode.toString());

const getEndTime = (time: number): number =>
  Math.round(time * 100) / 100;

const printLog = (method: string, url: string, statusCode: number, startTime: [number, number]) => {
  const endTime = process.hrtime(startTime)[1] / 1000000;
  console.info(
    `%s %s %s %dms`,
    method,
    url,
    getStatusCode(statusCode),
    getEndTime(endTime),
  );
};

export const logger$: Effect<HttpRequest> = (request$, response) => request$
  .pipe(
    tap(request => {
      const startTime = process.hrtime();

      response.on('finish', () => printLog(
        request.method!,
        request.url!,
        response.statusCode,
        startTime
      ));
    }),
  );
