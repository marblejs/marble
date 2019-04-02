import * as stream from 'stream';

export const isReadableStream = (data: any): data is stream.Readable =>
  data instanceof stream.Readable;
