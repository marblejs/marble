import * as fs from 'fs';
import * as path from 'path';
import { r, combineRoutes, use } from '@marblejs/core';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { multipart$, StreamHandler } from '@marblejs/middleware-multipart';
import { readFile } from '@marblejs/core/dist/+internal';
import { of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

const STATIC_PATH = path.resolve(__dirname, '../../../../assets');
const TMP_PATH = path.resolve(__dirname, '../../../../tmp');

const streamFileTo = (basePath: string): StreamHandler => {
  if (!fs.existsSync(basePath)) { fs.mkdirSync(basePath); }

  return ({ file, fieldname }) => {
    const destination = path.join(basePath, path.basename(fieldname));
    file.pipe(fs.createWriteStream(destination));
    return of({ destination });
  };
}

const getFileValidator$ = requestValidator$({
  params: t.type({ dir: t.string })
});

const postFile$ = r.pipe(
  r.matchPath('/upload'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    use(multipart$({
      files: ['image_1'],
      stream: streamFileTo(TMP_PATH),
    })),
    map(req => ({
      body: {
        file: req.file,
        body: req.body,
      },
    }))
  )));

const getFileStream$ = r.pipe(
  r.matchPath('/stream/:dir*'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    use(getFileValidator$),
    map(req => req.params.dir),
    map(dir => fs.createReadStream(path.resolve(STATIC_PATH, dir))),
    map(body => ({ body })),
  )),
);

const getFile$ = r.pipe(
  r.matchPath('/:dir*'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    use(getFileValidator$),
    map(req => req.params.dir),
    mergeMap(readFile(STATIC_PATH)),
    map(body => ({ body }))
  )));

export const static$ = combineRoutes(
  '/static',
  [ postFile$, getFileStream$, getFile$ ],
);
