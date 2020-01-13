import * as fs from 'fs';
import * as path from 'path';
import { r, combineRoutes, use } from '@marblejs/core';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { multipart$ } from '@marblejs/middleware-multipart';
import { streamFileTo } from '@marblejs/middleware-multipart/dist/multipart.util';
import { readFile } from '@marblejs/core/dist/+internal';
import { map, mergeMap } from 'rxjs/operators';

const STATIC_PATH = path.resolve(__dirname, '../../../../../assets');
const TMP_PATH = path.resolve(__dirname, '../../../../../tmp');

const getFileValidator$ = requestValidator$({
  params: t.type({ dir: t.string })
});

const postFile$ = r.pipe(
  r.matchPath('/upload'),
  r.matchType('POST'),
  r.useEffect(req$ => {
    console.log('Effect bootstrapped: "postFile$"');

    return req$.pipe(
      use(multipart$({
        files: ['image_1'],
        stream: streamFileTo(TMP_PATH),
      })),
      map(req => ({
        body: {
          file: req.files,
          body: req.body,
        },
      }))
    );
  }));

const getFileStream$ = r.pipe(
  r.matchPath('/stream/:dir*'),
  r.matchType('GET'),
  r.useEffect(req$ => {
    console.log('Effect bootstrapped: "getFileStream$"');

    return req$.pipe(
      use(getFileValidator$),
      map(req => req.params.dir),
      map(dir => fs.createReadStream(path.resolve(STATIC_PATH, dir))),
      map(body => ({ body })),
    );
  }));

const getFile$ = r.pipe(
  r.matchPath('/:dir*'),
  r.matchType('GET'),
  r.useEffect(req$ => {
    console.log('Effect bootstrapped: "getFile$"');

    return req$.pipe(
      use(getFileValidator$),
      map(req => req.params.dir),
      mergeMap(readFile(STATIC_PATH)),
      map(body => ({ body }))
    );
  }));

export const static$ = combineRoutes(
  '/static',
  [ postFile$, getFileStream$, getFile$ ],
);
