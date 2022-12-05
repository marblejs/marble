import * as O from 'fp-ts/lib/Option';
import { flow, pipe } from 'fp-ts/lib/function';
import { HttpRequest } from '@marblejs/http';
import { LoggerOptions } from './logger.model';

export const getDateFromTimestamp = (t: number) => new Date(t);

export const isNotSilent = (opts: LoggerOptions) => (_: HttpRequest) =>
  !opts.silent;

export const filterResponse = (opts: LoggerOptions) => (req: HttpRequest) => pipe(
  O.fromNullable(opts.filter),
  O.map(filter => filter(req)),
  O.getOrElse(() => true),
);

export const formatTime = (timeInMms: number) =>
  timeInMms > 1000
    ? `+${timeInMms / 1000}s`
    : `+${timeInMms}ms`;

export const getTimeDifferenceInMs = (startDate: Date): number =>
  new Date().getTime() - startDate.getTime();

export const factorizeTime = flow(
  getDateFromTimestamp,
  getTimeDifferenceInMs,
  formatTime,
);
