import { EffectFactory, httpListener, use } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { map } from 'rxjs/operators';
import { requestValidator$, t } from '../src';

const user = t.type({
  id: t.string,
  name: t.string,
  age: t.number,
});

const effect$ = EffectFactory
  .matchPath('/')
  .matchType('POST')
  .use(req$ => req$.pipe(
    use(requestValidator$({
      body: t.type({ user })
    })),
    map(req => ({ body: req.body.user })),
  ));

export const app = httpListener({
  middlewares: [bodyParser$()],
  effects: [effect$],
});
