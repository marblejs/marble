import { Stream } from 'stream';

export const isStream = (stream: any): stream is Stream =>
  stream !== null &&
  typeof stream === 'object' &&
  typeof stream.pipe === 'function';
