import * as path from 'path';
import { EffectFactory, combineRoutes, internal } from '@marblejs/core';
import { map, switchMap } from 'rxjs/operators';
const { readFile } = internal;

const STATIC_PATH = path.resolve(__dirname, '../../../../assets');

const getFile$ = EffectFactory
  .matchPath('/:dir*')
  .matchType('GET')
  .use(req$ => req$
    .pipe(
      map(req => req.params!.dir as string),
      switchMap(readFile(STATIC_PATH)),
      map(body => ({ body }))
    ));

export const static$ = combineRoutes(
  '/static',
  [ getFile$ ],
);
