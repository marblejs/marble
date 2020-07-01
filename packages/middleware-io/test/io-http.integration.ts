import { r, httpListener } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { map } from 'rxjs/operators';
import { validateRequest, t } from '../src';

const user = t.type({
  id: t.string,
  name: t.string,
  age: t.number,
});

const effect$ = r.pipe(
  r.matchPath('/'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    validateRequest({ body: t.type({ user }) }),
    map(req => ({ body: req.body.user })),
  )),
);

export const listener = httpListener({
  middlewares: [bodyParser$()],
  effects: [effect$],
});
