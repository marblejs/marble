import * as stream from 'stream';

export const isStream = (stream: any): stream is stream.Stream =>
  stream !== null &&
  typeof stream === 'object' &&
  typeof stream.pipe === 'function';
