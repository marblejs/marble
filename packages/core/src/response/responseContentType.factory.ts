import * as fileType from 'file-type';
import * as mime from 'mime';
import { HttpStatus } from '../http.interface';
import { ContentType } from '../util/contentType.util';

export const DEFAULT_CONTENT_TYPE = ContentType.APPLICATION_JSON;

export const getMimeType = (body: any, path: string) => {
  const mimeFromBuffer = Buffer.isBuffer(body) && fileType(body);

  if (mimeFromBuffer) {
    return mimeFromBuffer.mime;
  }

  return mime.getType(path) || DEFAULT_CONTENT_TYPE;
};

export const contentTypeFactory = (data: {
  body: any;
  path: string;
  status: HttpStatus;
}) => ({
  'Content-Type':
    data.status === 200
      ? getMimeType(data.body, data.path)
      : DEFAULT_CONTENT_TYPE,
});
