import chalk from 'chalk';
import { Http, HttpResponse } from '../http.interface';
import { Middleware } from './middleware.interface';

const getStatusCode = (statusCode: number): string =>
  statusCode >= 400
    ? chalk.red(statusCode.toString())
    : chalk.green(statusCode.toString());

export const loggerMiddleware: Middleware = http => {
  const { info } = console;
  const { req, res } = http;

  const hrStartTime = process.hrtime();

  res.on('finish', () => {
    const endTime = process.hrtime(hrStartTime)[1] / 1000000;
    info(
      `%s %s %s %dms`,
      req.method,
      req.url,
      getStatusCode(res.statusCode),
      Math.round(endTime * 100) / 100
    );
  });

  return http;
};
