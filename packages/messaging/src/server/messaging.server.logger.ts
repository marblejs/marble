import chalk from 'chalk';
import { pipe } from 'fp-ts/lib/pipeable';
import { getOrElse } from 'fp-ts/lib/Option';
import { ContextProvider } from '@marblejs/core';
import { LoggerToken } from './messaging.server.tokens';

export enum LoggerLevel { INFO, WARN, ERROR }
export type LoggerOptions = { channel: string; message: string; tag: string; level?: LoggerLevel };
export type Logger = (opts: LoggerOptions) => any;

export const provideLogger = (ask: ContextProvider): Logger => pipe(
  ask(LoggerToken),
  getOrElse(() => log),
);

const log: Logger = ({ channel, message, tag, level = LoggerLevel.INFO }) => {
  const now = new Date().toISOString();
  const colorize = {
    [LoggerLevel.ERROR]: chalk.red,
    [LoggerLevel.INFO]: chalk.green,
    [LoggerLevel.WARN]: chalk.yellow,
  }[level];
  return console.log(`${now}\t${channel}\t${colorize(tag)}\t${message}`);
};
