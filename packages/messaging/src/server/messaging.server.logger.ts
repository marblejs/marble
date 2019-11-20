import chalk from 'chalk';
import { pipe } from 'fp-ts/lib/pipeable';
import { getOrElse } from 'fp-ts/lib/Option';
import { ContextProvider } from '@marblejs/core';
import { LoggerToken } from './messaging.server.tokens';

const IS_TEST_ENV = process.env.NODE_ENV === 'test';

export enum LoggerLevel { INFO, WARN, ERROR }
export type LoggerOptions = { channel: string; message: string; tag: string; level?: LoggerLevel };
export type Logger = (opts: LoggerOptions) => any;

export const provideLogger = (ask: ContextProvider): Logger => pipe(
  ask(LoggerToken),
  getOrElse(() => !IS_TEST_ENV ? defaultLogger : () => undefined),
);

const defaultLogger: Logger = ({ channel, message, tag, level = LoggerLevel.INFO }) => {
  const now = new Date().toISOString();
  const colorize = {
    [LoggerLevel.ERROR]: chalk.red,
    [LoggerLevel.INFO]: chalk.green,
    [LoggerLevel.WARN]: chalk.yellow,
  }[level];
  return console.log(now.padEnd(30) + channel.padEnd(15) + colorize(tag.padEnd(15)) + message);
};
