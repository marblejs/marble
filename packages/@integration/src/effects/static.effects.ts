import * as fs from 'fs';
import * as path from 'path';
import { r, combineRoutes, use } from '@marblejs/core';
import { requestValidator$, t } from '@marblejs/middleware-io';
import { readFile } from '@marblejs/core/dist/+internal';
import { map, mergeMap } from 'rxjs/operators';

const STATIC_PATH = path.resolve(__dirname, '../../../../assets');

const getFileValidator$ = requestValidator$({
  params: t.type({ dir: t.string })
});

const getFileStream$ = r.pipe(
  r.matchPath('/stream/:dir*'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    use(getFileValidator$),
    map(req => req.params.dir),
    map(dir => fs.createReadStream(path.resolve(STATIC_PATH, dir))),
    map(body => ({ body }))
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
  [ getFileStream$, getFile$ ],
);
