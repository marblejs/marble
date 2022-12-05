import * as chalk from 'chalk';
import * as IO from 'fp-ts/lib/IO';
import * as O from 'fp-ts/lib/Option';
import { identity, constUndefined, pipe } from 'fp-ts/lib/function';
import { createReader } from '../context/context.reader.factory';
import { trunc } from '../+internal/utils';
import { Logger, LoggerLevel } from './logger.interface';

const print = (message: string): IO.IO<void> => () => {
  process.stdout.write(message + '\n');
};

const colorizeText = (level: LoggerLevel): ((s: string) => string) =>
  pipe(
    O.fromNullable({
      [LoggerLevel.ERROR]: chalk.red,
      [LoggerLevel.INFO]: chalk.green,
      [LoggerLevel.WARN]: chalk.yellow,
      [LoggerLevel.DEBUG]: chalk.magenta,
      [LoggerLevel.VERBOSE]: identity,
    }[level]),
    O.getOrElse(() => identity),
  );

const formatDate = (date: Date): string => date
  .toISOString()
  .replace(/T/, ' ')
  .replace(/\..+/, '');

export const logger = createReader<Logger>(() => opts => {
  const sep = ' - ';
  const truncItem = trunc(15);
  const colorize = colorizeText(opts.level ?? LoggerLevel.INFO);

  const sign = chalk.magenta('λ');
  const now: string = formatDate(new Date());
  const pid: string = chalk.green((process.pid.toString() ?? '-'));
  const tag: string = chalk.gray(truncItem(opts.tag)) + ' ' + colorize(`[${opts.type}]`);
  const message: string = opts.level === LoggerLevel.ERROR ? chalk.red(opts.message) : opts.message;

  return print(sign + sep + pid + sep + now + sep + tag + sep + message);
});

export const mockLogger = createReader<Logger>(() => _ => IO.of(constUndefined));
