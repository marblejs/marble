import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { flow } from 'fp-ts/lib/function';
import { LoggerOptions, LoggerCtx, WritableLike } from './logger.model';

export const getDateFromTimestamp = (t: number) => new Date(t);

export const isNotSilent = (opts: LoggerOptions) => (_: LoggerCtx) =>
  !opts.silent;

export const filterResponse = (opts: LoggerOptions) => (ctx: LoggerCtx) => pipe(
  O.fromNullable(opts.filter),
  O.map(filter => filter(ctx.res, ctx.req)), // @TODO: use only HttpRequest
  O.getOrElse(() => true),
);

export const writeToStream = (writable: WritableLike, chunk: string) =>
  writable.write(`${chunk}\n\n`);

export const formatTime = (timeInMms: number) =>
  timeInMms > 1000
    ? `${timeInMms / 1000}s`
    : `${timeInMms}ms`;

export const getTimeDifferenceInMs = (startDate: Date): number =>
  new Date().getTime() - startDate.getTime();

export const factorizeTime = flow(
  getDateFromTimestamp,
  getTimeDifferenceInMs,
  formatTime,
);
