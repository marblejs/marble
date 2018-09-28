import chalk from 'chalk';

export const formatStatusCode = (statusCode: number): string =>
  statusCode >= 400
    ? chalk.yellow(statusCode.toString())
    : chalk.green(statusCode.toString());

export const printLog = (
  method: string,
  url: string,
  statusCode: string,
  formattedTime: string
) => {
  console.info(`%s %s %s %s`, method, url, statusCode, formattedTime);
};
