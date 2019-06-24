import * as fs from 'fs';
import * as path from 'path';
import { of } from 'rxjs';
import { HttpRequest } from '@marblejs/core';
import { getContentType } from '@marblejs/core/dist/+internal/http';
import { FileIncomingData, StreamHandler } from './multipart.interface';

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
    req.files = {
      ...req.files || {},
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

export const streamFileTo = (basePath: string): StreamHandler => {
  if (!fs.existsSync(basePath)) { fs.mkdirSync(basePath); }

  return ({ file, fieldname }) => {
    const destination = path.join(basePath, path.basename(fieldname));
    file.pipe(fs.createWriteStream(destination));
    return of({ destination });
  };
}
