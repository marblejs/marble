import { HttpRequest } from '@marblejs/core';
import { getContentType } from '@marblejs/core/dist/+internal/http';
import { FileIncomingData } from './multipart.interface';

type ComputedFileData = Partial<{ buffer: Buffer; destination: any; size: number }>;

const isProperMethod = (req: HttpRequest): boolean =>
  ['POST', 'PUT'].includes(req.method);

const isMultipart = (req: HttpRequest): boolean =>
  getContentType(req.headers).includes('multipart/');

export const shouldParseFieldname = (files: string[] | undefined) => (fieldname: string) =>
  !!files ? files.includes(fieldname) : true;

export const shouldParseMultipart = (req: HttpRequest) =>
  isProperMethod(req) && isMultipart(req);

export const setRequestData =
  (req: HttpRequest) =>
  (incomingFile: FileIncomingData) =>
  ({ buffer, destination, size }: ComputedFileData) => {
    req.file = {
      ...req.file || {},
      [incomingFile.fieldname]: {
        size,
        buffer,
        destination,
        encoding: incomingFile.encoding,
        mimetype: incomingFile.mimetype,
        filename: incomingFile.filename,
        fieldname: incomingFile.fieldname,
      },
    };
}
