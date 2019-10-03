import { pipe } from 'fp-ts/lib/pipeable';
import { flow } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import { LoggerOptions, LoggerCtx, WritableLike } from './logger.model';

export const isNotSilent = (opts: LoggerOptions) => (_: LoggerCtx) =>
  !opts.silent;

export const filterResponse = (opts: LoggerOptions) => (ctx: LoggerCtx) => pipe(
  O.fromNullable(opts.filter),
  O.map(filter => filter(ctx.res, ctx.req)),
  O.getOrElse(() => true),
);

export const writeToStream = (writable: WritableLike, chunk: string) =>
  writable.write(`${chunk}\n\n`);

export const formatTime = (timeInMms: number) =>
  timeInMms > 1000
    ? `${timeInMms / 1000}s`
    : `${timeInMms}ms`;

export const getTimeDifferenceInMs = (startTime: Date): number =>
  new Date().getTime() - startTime.getTime();

export const factorizeTime = flow(
  (t: number) => new Date(t),
  getTimeDifferenceInMs,
  formatTime,
);
