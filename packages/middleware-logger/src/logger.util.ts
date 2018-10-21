import { WriteStream } from 'fs';
import { HttpResponse } from '@marblejs/core';
import { Maybe, compose } from '@marblejs/core/dist/+internal';
import { LoggerOptions } from './logger.model';

export const isNotSilent = (opts: LoggerOptions) => () =>
  !opts.silent;

export const filterResponse = (opts: LoggerOptions) => (res: HttpResponse) =>
  Maybe.of(opts.filter)
    .map(filter => filter(res))
    .valueOr(true);

export const writeToStream = (stream: WriteStream, chunk: string) =>
  stream.write(`${chunk}\n\n`);

export const formatTime = (timeMs: number) =>
  timeMs > 1000
    ? `${timeMs / 1000}s`
    : `${timeMs}ms`;

export const getTimeDifferencIneMs = (startTime: Date): number =>
  new Date().getTime() - startTime.getTime();

export const factorizeTime = (timestamp: number) =>
  compose(
    formatTime,
    getTimeDifferencIneMs
  )(new Date(timestamp));
