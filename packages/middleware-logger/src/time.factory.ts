import { compose } from '@marblejs/core/dist/+internal';

export const formatTime = (timeMs: number) =>
  timeMs > 1000
    ? `${timeMs / 1000}s`
    : `${timeMs}ms`;

export const getTimeDifferenceMs = (startTime: Date): number =>
  new Date().getTime() - startTime.getTime();

export const factorizeTime = (timestamp: number) =>
  compose(
    formatTime,
    getTimeDifferenceMs
  )(new Date(timestamp));
