import * as fs from 'fs';
import * as path from 'path';
import { Observable } from 'rxjs';
import { HttpError, HttpStatus } from '../core/src';

export const readFile = (basePath: string) => (dir: string) =>
  new Observable<Buffer>(subscriber => {
    const pathname = path.resolve(basePath, dir);

    fs.readFile(pathname, (err, file) => {
      if (err && err.code === 'ENOENT') {
        const error = new HttpError('File not found', HttpStatus.NOT_FOUND);
        subscriber.error(error);
      }
      subscriber.next(file);
      subscriber.complete();
    });
  });
