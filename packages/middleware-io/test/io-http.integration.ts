import { EffectFactory, httpListener, use } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { map } from 'rxjs/operators';
import { httpValidator$, io } from '../src';

const user = io.type({
  id: io.string,
  name: io.string,
  age: io.number,
});

const effect$ = EffectFactory
  .matchPath('/')
  .matchType('POST')
  .use(req$ => req$.pipe(
    use(httpValidator$({
      body: io.type({ user })
    })),
    map(req => ({ body: req.body.user })),
  ));

export const app = httpListener({
  middlewares: [bodyParser$],
  effects: [effect$],
});
