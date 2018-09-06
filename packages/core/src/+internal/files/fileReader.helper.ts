import * as fs from 'fs';
import * as path from 'path';
import { Observable } from 'rxjs';

export const readFile = (basePath: string) => (dir: string) =>
  new Observable<Buffer>(subscriber => {
    const pathname = path.resolve(basePath, dir);

    fs.readFile(pathname, (err, file) => {
      if (err && err.code === 'ENOENT') {
        subscriber.error(err);
      }
      subscriber.next(file);
      subscriber.complete();
    });
  });
