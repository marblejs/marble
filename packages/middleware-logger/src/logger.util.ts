import { WriteStream } from 'fs';
import { fromNullable } from 'fp-ts/lib/Option';
import { HttpResponse } from '@marblejs/core';
import { compose } from '@marblejs/core/dist/+internal';
import { LoggerOptions } from './logger.model';

export const isNotSilent = (opts: LoggerOptions) => () =>
  !opts.silent;

export const filterResponse = (opts: LoggerOptions) => (res: HttpResponse) =>
  fromNullable(opts.filter)
    .map(filter => filter(res))
    .getOrElse(true);

export const writeToStream = (stream: WriteStream, chunk: string) =>
  stream.write(`${chunk}\n\n`);

export const formatTime = (timeInMms: number) =>
  timeInMms > 1000
    ? `${timeInMms / 1000}s`
    : `${timeInMms}ms`;

export const getTimeDifferenceInMs = (startTime: Date): number =>
  new Date().getTime() - startTime.getTime();

export const factorizeTime = (timestamp: number) =>
  compose(
    formatTime,
    getTimeDifferenceInMs
  )(new Date(timestamp));
