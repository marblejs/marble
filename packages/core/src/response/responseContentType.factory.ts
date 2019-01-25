import * as fileType from 'file-type';
import * as mime from 'mime';
import { HttpStatus } from '../http.interface';
import { ContentType } from '../+internal';

export const DEFAULT_CONTENT_TYPE = ContentType.APPLICATION_JSON;

export const getMimeType = (body: any, path: string) => {
  const mimeFromBuffer = Buffer.isBuffer(body) && fileType(body);
  return mimeFromBuffer
    ? mimeFromBuffer.mime
    : mime.getType(path) || DEFAULT_CONTENT_TYPE;
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
