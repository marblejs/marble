import * as path from 'path';
import { EffectFactory, combineRoutes, use } from '@marblejs/core';
import { httpValidator$, t } from '@marblejs/middleware-io';
import { readFile } from '@marblejs/core/dist/+internal';
import { map, mergeMap } from 'rxjs/operators';

const STATIC_PATH = path.resolve(__dirname, '../../../../assets');

const getFileValidator$ = httpValidator$({
  params: t.type({ dir: t.string })
});

const getFile$ = EffectFactory
  .matchPath('/:dir*')
  .matchType('GET')
  .use(req$ => req$.pipe(
    use(getFileValidator$),
    map(req => req.params.dir),
    mergeMap(readFile(STATIC_PATH)),
    map(body => ({ body }))
  ));

export const static$ = combineRoutes(
  '/static',
  [ getFile$ ],
);
