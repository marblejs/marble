import { IO } from 'fp-ts/lib/IO'

export type Logger = (opts: LoggerOptions) => IO<void>;

export enum LoggerLevel { INFO, WARN, ERROR, DEBUG, VERBOSE }

export type LoggerOptions = {
  tag: string;
  type: string;
  message: string;
  level?: LoggerLevel;
};

export const enum LoggerTag {
  CORE = 'core',
  HTTP = 'http',
  MESSAGING = 'messaging',
  EVENT_BUS = 'event_bus',
  WEBSOCKETS = 'websockets',
};
